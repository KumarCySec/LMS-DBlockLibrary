from flask import Blueprint, request, jsonify
from extensions import db, jwt
from models import User, Role, user_roles
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import random
from utils.email_service import EmailService


auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Basic validation
    required_fields = ['name', 'roll_number', 'email', 'password', 'batch', 'department_id']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    if User.query.filter((User.email == data['email']) | (User.roll_number == data['roll_number'])).first():
        return jsonify({"error": "User with this email or roll number already exists"}), 409

    # Create Student
    new_user = User(
        name=data['name'],
        roll_number=data['roll_number'],
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        batch=data['batch'],
        department_id=data['department_id'],
        phone_number=data.get('phone_number'),
        status='pending_approval' # Default status
    )
    
    # Assign Student Role
    student_role = Role.query.filter_by(name='Student').first()
    if student_role:
        new_user.roles.append(student_role)
    
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Registration successful. Please wait for admin approval."}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid credentials"}), 401

    if user.status != 'approved':
        msg = f"Account is {user.status}. Please contact admin."
        if user.status == 'rejected' and user.rejection_reason:
            msg = f"Account Rejected: {user.rejection_reason}"
        return jsonify({"error": msg}), 403

    # Create JWT
    access_token = create_access_token(identity=str(user.id))
    
    # Get single role
    role_name = user.role
    
    # Get permissions
    permissions = user.get_all_permissions()

    return jsonify({
        "access_token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": role_name,
            "permissions": permissions,
            "department_id": user.department_id
        }
    }), 200

def user_to_dict(user):
    """Safe, minimal serializer for User."""
    try:
        # Try to get role safely
        role_name = None
        if hasattr(user, 'role'):
            role_name = user.role
        elif hasattr(user, 'roles') and user.roles:
             role_name = user.roles[0].name
        
        # Try to get permissions safely
        permissions = []
        try:
            permissions = user.get_all_permissions()
        except Exception:
            permissions = []

        return {
            "id": user.id,
            "name": getattr(user, "name", None),
            "email": getattr(user, "email", None),
            "roll_number": getattr(user, "roll_number", None),
            "role": role_name,
            "permissions": permissions,
            "department_id": getattr(user, "department_id", None),
            "department": getattr(user.department, "name", None) if getattr(user, "department", None) else None,
            "batch": getattr(user, "batch", None),
            "status": getattr(user, "status", None)
        }
    except Exception as e:
        # Fallback if something goes terribly wrong
        return {
            "id": user.id,
            "name": "Error Loading User",
            "email": "",
            "role": None,
            "permissions": [],
            "error": str(e)
        }

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    """Return the current logged-in user's profile + role + permissions + stats."""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404

        data = user_to_dict(user)
        
        # Add Stats & History
        from models import Transaction
        
        # Current Borrowings
        current_borrowings = Transaction.query.filter(
            Transaction.borrower_id == user.id,
            Transaction.status.in_(['ISSUED', 'OVERDUE', 'RENEW_REQUESTED'])
        ).count()
        
        # Books Read (Returned)
        books_read = Transaction.query.filter(
            Transaction.borrower_id == user.id,
            Transaction.status == 'RETURNED'
        ).count()
        
        # Days with Book (Simple calculation: sum of duration of returned books)
        # For a more complex "streak" or "active days", we'd need more logic.
        # Here we'll just sum up the days they held books.
        returned_txs = Transaction.query.filter(
            Transaction.borrower_id == user.id,
            Transaction.status == 'RETURNED'
        ).all()
        
        total_days = 0
        history = []
        
        for tx in returned_txs:
            if tx.issue_date and tx.return_date:
                duration = (tx.return_date - tx.issue_date).days
                total_days += duration
            
            # Add to history list (limit to last 5 for profile summary, or all?)
            # Let's send last 10
            pass

        # Fetch detailed history for the list
        history_txs = Transaction.query.filter(
            Transaction.borrower_id == user.id,
            Transaction.status == 'RETURNED'
        ).order_by(Transaction.return_date.desc()).limit(10).all()
        
        for tx in history_txs:
             history.append({
                "id": tx.id,
                "title": tx.item.title,
                "author": tx.item.author,
                "issue_date": tx.issue_date.isoformat() if tx.issue_date else None,
                "return_date": tx.return_date.isoformat() if tx.return_date else None,
                "fine": tx.fine_accrued
             })

        data['stats'] = {
            "current_borrowings": current_borrowings,
            "books_read": books_read,
            "total_days_reading": total_days
        }
        data['history'] = history

        return jsonify(data), 200
    except Exception as e:
        # Last resort catch-all
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

@auth_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_me():
    """Update current user's profile."""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        data = request.get_json()
        
        # Allowed fields
        if 'phone_number' in data:
            user.phone_number = data['phone_number']
        if 'email' in data:
            # TODO: Validate email format?
            user.email = data['email']
            
        # Don't allow changing roll_number, batch, department without admin
        
        db.session.commit()
        
        return jsonify({"message": "Profile updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Failed to update profile", "details": str(e)}), 500

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({"error": "Email is required"}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user:
        # User explicitly requested to know if email doesn't exist
        return jsonify({"error": "No account found with this email."}), 404
        
    # Rate Limiting & Cooldown
    current_time = datetime.utcnow()
    
    # 1. Cooldown Check (2 minutes)
    if user.otp_last_sent_at and (current_time - user.otp_last_sent_at) < timedelta(minutes=2):
        return jsonify({"error": "Please wait a few minutes before requesting another OTP."}), 429
        
    # 2. Daily Limit Check (Max 3 per day)
    # Handle None values safely
    sent_count = user.otp_sent_count if user.otp_sent_count is not None else 0
    
    if user.otp_last_sent_at and user.otp_last_sent_at.date() == current_time.date():
        if sent_count >= 3:
             return jsonify({"error": "Daily OTP limit reached. Please try again tomorrow."}), 429
        user.otp_sent_count = sent_count + 1
    else:
        # Reset count for new day
        user.otp_sent_count = 1
        
    user.otp_last_sent_at = current_time

    # Generate OTP
    otp = str(random.randint(100000, 999999))
    user.reset_otp = otp
    user.reset_otp_expiry = current_time + timedelta(minutes=10)
    
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Database error during OTP generation: {e}")
        # Return strict error to frontend so we know it's DB related
        return jsonify({"error": f"Database Error: {str(e)}"}), 500
    
    # Send Email
    try:
        if EmailService.send_otp_email(user.email, otp, user.name):
            return jsonify({"message": "OTP sent successfully."}), 200
        else:
            return jsonify({"error": "Failed to send email. Please try again later."}), 500
    except Exception as e:
        print(f"Email sending error: {e}")
        return jsonify({"error": "Failed to send email."}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    email = data.get('email')
    otp = data.get('otp')
    new_password = data.get('password')
    
    if not all([email, otp, new_password]):
        return jsonify({"error": "Email, OTP, and Password are required"}), 400
        
    user = User.query.filter_by(email=email).first()
    
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Ensure strings and strip
    received_otp = str(otp).strip()
    stored_otp = str(user.reset_otp).strip() if user.reset_otp else ""

    if stored_otp != received_otp:
        return jsonify({"error": "Invalid OTP provided"}), 400
        
    # Safely check expiry
    if not user.reset_otp_expiry or user.reset_otp_expiry < datetime.utcnow():
        return jsonify({"error": "OTP has expired. Please request a new one."}), 400
        
    # Reset Password
    user.password_hash = generate_password_hash(new_password)
    user.reset_otp = None
    user.reset_otp_expiry = None
    db.session.commit()
    
    return jsonify({"message": "Password reset successfully. You can now login."}), 200
