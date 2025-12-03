from flask import Blueprint, request, jsonify
from extensions import db
from models import User, Role, Transaction
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps

users_bp = Blueprint('users', __name__)

def role_required(required_roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            user_roles = [r.name for r in user.roles]
            if not any(role in user_roles for role in required_roles):
                return jsonify({"error": "Insufficient permissions"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

@users_bp.route('/', methods=['GET'])
@jwt_required()
@role_required(['Admin', 'Incharge'])
def list_users():
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
        result.append({
            "id": user.id,
            "name": user.name,
            "roll_number": user.roll_number,
            "email": user.email,
            "status": user.status,
            "roles": [r.name for r in user.roles],
            "department_id": user.department_id,
            "department_name": user.department.name if user.department else None,
            "batch": user.batch
        })
    
    return jsonify(result), 200

@users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
@role_required(['Admin', 'Incharge'])
def get_user_detail(user_id):
    user = User.query.get_or_404(user_id)
    
    # Fetch active checkouts
    active_txns = Transaction.query.filter_by(borrower_id=user.id, status='ISSUED').all()
    current_checkouts = []
    outstanding_fines = 0.0
    
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

    # Fetch past transactions (limit 10)
    past_txns = Transaction.query.filter(
        Transaction.borrower_id == user.id, 
        Transaction.status.in_(['RETURNED', 'CANCELLED'])
    ).order_by(Transaction.processed_at.desc()).limit(10).all()
    
    past_transactions = []
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

    # Verification info
    verified_by = None
    if user.approved_by_id:
        approver = User.query.get(user.approved_by_id)
        if approver:
            verified_by = {"id": approver.id, "name": approver.name, "role": "Admin"} # Simplified role

    return jsonify({
        "id": user.id,
        "name": user.name,
        "roll_number": user.roll_number,
        "email": user.email,
        "phone": user.phone_number,
        "batch": user.batch,
        "department": {"id": user.department.id, "name": user.department.name} if user.department else None,
        "department_id": user.department_id, # Keep for compatibility
        "status": user.status,
        "roles": [r.name for r in user.roles],
        "verified_by": verified_by,
        "verified_at": user.approved_at.isoformat() if user.approved_at else None,
        "current_checkouts": current_checkouts,
        "past_transactions": past_transactions,
        "outstanding_fines_total": outstanding_fines,
        "notes": "No notes" # Placeholder
    }), 200
