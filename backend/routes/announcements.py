from flask import Blueprint, request, jsonify
from extensions import db
from models.misc import Announcement, Notification
from models.users import User, Role
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.decorators import permission_required

announcements_bp = Blueprint('announcements', __name__)

@announcements_bp.route('', methods=['GET'])
@jwt_required()
def get_announcements():
    # Return all for admin, or targeted for user
    # For now, just return all created announcements for admin view
    # Filter announcements for the current user
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify([]), 200

    query = Announcement.query.order_by(Announcement.created_at.desc())
    all_anns = query.all()
    
    # Filter in Python (easier for hybrid logic) or SQL
    filtered_anns = []
    for a in all_anns:
        is_relevant = False
        if a.target_type == 'all':
            is_relevant = True
        elif a.target_type == 'role' and user.role == a.target_value:
            is_relevant = True
        elif a.target_type == 'department' and user.department and user.department.name == a.target_value:
             is_relevant = True
        elif a.target_type == 'batch' and user.batch == a.target_value:
             is_relevant = True
        elif a.target_type == 'specific_user' and str(a.target_value) == str(user.id):
             is_relevant = True
        # For overdue/checked_out, we'd need complex logic. For now, show them if user has that status?
        # Simpler: If user is admin, show all?
        if user.role in ['Admin', 'Incharge']: # Admins see all
            is_relevant = True
            
        if is_relevant:
            filtered_anns.append({
                "id": a.id,
                "title": a.title,
                "message": a.message,
                "target_type": a.target_type,
                "target_value": a.target_value,
                "created_at": a.created_at.isoformat(), # Use isoformat to prevent jsonify issues
                "created_by": a.created_by.name if a.created_by else "Unknown"
            })
            
    return jsonify(filtered_anns), 200

@announcements_bp.route('', methods=['POST'])
@jwt_required()
@permission_required('manage_settings') # Assuming admin/incharge
def create_announcement():
    data = request.get_json()
    title = data.get('title')
    message = data.get('message')
    target_type = data.get('target_type') # all, role, department, batch
    target_value = data.get('target_value')
    
    current_user_id = get_jwt_identity()
    
    ann = Announcement(
        title=title,
        message=message,
        target_type=target_type,
        target_value=target_value,
        created_by_id=current_user_id
    )
    db.session.add(ann)
    db.session.commit()
    
    try:
        # Fan-out Notifications
        users_to_notify = []
        
        if target_type == 'all':
            users_to_notify = User.query.filter(User.status == 'approved').all()
        elif target_type == 'role':
            role = Role.query.filter_by(name=target_value).first()
            if role:
                users_to_notify = role.users
        elif target_type == 'department':
            from models.users import Department
            dept = Department.query.filter_by(name=target_value).first()
            if dept:
                users_to_notify = User.query.filter_by(department_id=dept.id).all()
        elif target_type == 'batch':
            users_to_notify = User.query.filter_by(batch=target_value).all()
        elif target_type == 'specific_user':
            # target_value should be user_id
            user = User.query.get(target_value)
            if user:
                users_to_notify = [user]
        elif target_type == 'overdue_users':
            from models.inventory import Transaction
            from datetime import datetime
            # Find users with overdue items
            overdue_txs = Transaction.query.filter(
                Transaction.status.in_(['ISSUED', 'OVERDUE']),
                Transaction.due_date < datetime.utcnow()
            ).all()
            users_to_notify = list(set([tx.user for tx in overdue_txs]))
        elif target_type == 'checked_out_users':
            from models.inventory import Transaction
            # Find users with active checkouts
            active_txs = Transaction.query.filter(Transaction.status == 'ISSUED').all()
            users_to_notify = list(set([tx.user for tx in active_txs]))
            
        count = 0
        for u in users_to_notify:
            if u.id == current_user_id: continue
            
            notif = Notification(
                user_id=u.id,
                type='announcement',
                title=f"📢 {title}",
                body=message,
                read_flag=False
            )
            db.session.add(notif)
            count += 1
            
        db.session.commit()
        
        return jsonify({"message": f"Announcement created and sent to {count} users"}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error sending announcement: {str(e)}")
        return jsonify({"error": str(e)}), 500
