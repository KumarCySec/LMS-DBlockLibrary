from flask import Blueprint, request, jsonify
from extensions import db
from models import User, Role, Transaction
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
from utils.decorators import role_required, permission_required

users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('manage_users')
def list_users():
    try:
        status = request.args.get('status')
        role_filter = request.args.get('role')
        department_id = request.args.get('department_id', type=int)
        batch = request.args.get('batch')
        search = request.args.get('search')
        
        query = User.query
        
        if status and status != 'all':
            query = query.filter_by(status=status)
        
        if role_filter:
            query = query.join(User.roles).filter(Role.name == role_filter)
            
        if department_id:
            query = query.filter(User.department_id == department_id)
            
        if batch:
            query = query.filter(User.batch == batch)
            
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (User.name.ilike(search_term)) | 
                (User.roll_number.ilike(search_term)) | 
                (User.email.ilike(search_term))
            )
            
        users = query.all()
        
        result = []
        for user in users:
            try:
                role_name = None
                if hasattr(user, 'role'):
                    role_name = user.role
                elif hasattr(user, 'roles') and user.roles:
                    role_name = user.roles[0].name
                
                result.append({
                    "id": user.id,
                    "name": user.name,
                    "roll_number": user.roll_number,
                    "email": user.email,
                    "status": user.status,
                    "role": role_name,
                    "department_id": user.department_id,
                    "department_name": user.department.name if user.department else None,
                    "batch": user.batch
                })
            except:
                continue
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch users", "details": str(e)}), 500

@users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
@permission_required('manage_users')
def get_user_detail(user_id):
    try:
        user = User.query.get_or_404(user_id)
        
        # Fetch active checkouts
        current_checkouts = []
        outstanding_fines = 0.0
        try:
            active_txns = Transaction.query.filter_by(borrower_id=user.id, status='ISSUED').all()
            for txn in active_txns:
                current_checkouts.append({
                    "transaction_id": txn.transaction_id,
                    "inventory_id": txn.inventory_item_id,
                    "title": txn.item.title if txn.item else "Unknown",
                    "type": txn.item.type if txn.item else "Unknown",
                    "issue_date": txn.issue_date.isoformat() if txn.issue_date else None,
                    "due_date": txn.due_date.isoformat() if txn.due_date else None,
                    "status": txn.status,
                    "renewal_count": txn.renewal_count,
                    "fine_accrued": txn.fine_accrued,
                    "approved_by": {"id": txn.approver.id, "name": txn.approver.name} if txn.approver else None
                })
                outstanding_fines += txn.fine_accrued
        except:
            pass

        # Fetch past transactions (limit 10)
        past_transactions = []
        try:
            past_txns = Transaction.query.filter(
                Transaction.borrower_id == user.id, 
                Transaction.status.in_(['RETURNED', 'CANCELLED'])
            ).order_by(Transaction.processed_at.desc()).limit(10).all()
            
            for txn in past_txns:
                past_transactions.append({
                    "transaction_id": txn.transaction_id,
                    "inventory_id": txn.inventory_item_id,
                    "title": txn.item.title if txn.item else "Unknown",
                    "type": txn.item.type if txn.item else "Unknown",
                    "issue_date": txn.issue_date.isoformat() if txn.issue_date else None,
                    "return_date": txn.return_date.isoformat() if txn.return_date else None,
                    "renewal_count": txn.renewal_count,
                    "fine": txn.fine_accrued,
                    "processed_by": {"id": txn.processed_by_id} if txn.processed_by_id else None
                })
        except:
            pass

        # Verification info
        verified_by = None
        try:
            if user.approved_by_id:
                approver = User.query.get(user.approved_by_id)
                if approver:
                    verified_by = {"id": approver.id, "name": approver.name, "role": "Admin"}
        except:
            pass

        role_name = None
        if hasattr(user, 'role'):
            role_name = user.role
        elif hasattr(user, 'roles') and user.roles:
            role_name = user.roles[0].name

        return jsonify({
            "id": user.id,
            "name": user.name,
            "roll_number": user.roll_number,
            "email": user.email,
            "phone": user.phone_number,
            "batch": user.batch,
            "department": {"id": user.department.id, "name": user.department.name} if user.department else None,
            "department_id": user.department_id, 
            "status": user.status,
            "role": role_name,
            "verified_by": verified_by,
            "verified_at": user.approved_at.isoformat() if user.approved_at else None,
            "current_checkouts": current_checkouts,
            "past_transactions": past_transactions,
            "outstanding_fines_total": outstanding_fines,
            "notes": "No notes" 
        }), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch user details", "details": str(e)}), 500
@users_bp.route('/<int:user_id>/approve', methods=['POST'])
@jwt_required()
@permission_required('approve_users')
def approve_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    action = data.get('action') # 'approve' or 'reject'
    reason = data.get('reason')
    
    current_admin_id = get_jwt_identity()
    
    if action == 'approve':
        user.status = 'approved'
        user.approved_by_id = current_admin_id
        user.approved_at = datetime.utcnow()
        # Ensure role is assigned (default Student)
        if not user.roles:
            student_role = Role.query.filter_by(name='Student').first()
            if student_role:
                user.roles.append(student_role)
                
    elif action == 'reject':
        user.status = 'rejected'
        user.rejected_by_id = current_admin_id
        user.rejected_at = datetime.utcnow()
        if reason:
            user.rejection_reason = reason
            
    else:
        return jsonify({"error": "Invalid action"}), 400
        
    db.session.commit()
    return jsonify({"message": f"User {action}d successfully"}), 200
        
@users_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
@permission_required('manage_users')
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    force = request.args.get('force', 'false').lower() == 'true'
    
    # Check for active transactions
    active_txns = Transaction.query.filter_by(borrower_id=user.id, status='ISSUED').all()
    
    if active_txns:
        if not force:
            return jsonify({
                "error": "User has active transactions", 
                "active_count": len(active_txns),
                "requires_confirmation": True
            }), 400
        else:
            # Return items to inventory
            current_user_id = get_jwt_identity()
            for txn in active_txns:
                txn.status = 'RETURNED'
                txn.return_date = datetime.utcnow()
                txn.processed_by_id = current_user_id
                
                # Update inventory
                if txn.item:
                    txn.item.quantity_available += 1
                
                if txn.copy:
                    txn.copy.status = 'AVAILABLE'
                    
    # Delete user
    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "User deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete user", "details": str(e)}), 500
