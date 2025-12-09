from flask import Blueprint, request, jsonify
from extensions import db
from models import LibraryStatus, Notification, Waitlist, User, InventoryItem, Department
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from utils.decorators import role_required, permission_required

common_bp = Blueprint('common', __name__)

# --- Library Status ---

@common_bp.route('/ping', methods=['GET'])
def ping():
    return jsonify({"message": "pong", "status": "active"}), 200

@common_bp.route('/status', methods=['GET'])
def get_status():
    try:
        status = LibraryStatus.query.order_by(LibraryStatus.updated_at.desc()).first()
        if not status:
            return jsonify({
                "is_open": False, 
                "message": "Status not set yet",
                "updated_by": None,
                "updated_at": None
            }), 200
        
        user_data = None
        if status.last_updated_by:
            try:
                user = User.query.get(status.last_updated_by)
                if user:
                    role_name = None
                    if hasattr(user, 'role'):
                        role_name = user.role
                    elif hasattr(user, 'roles') and user.roles:
                        role_name = user.roles[0].name
                    
                    user_data = {
                        "id": user.id,
                        "name": user.name,
                        "role": role_name
                    }
            except:
                pass

        return jsonify({
            "is_open": status.is_open,
            "message": status.message,
            "next_open": status.next_estimated_open_time,
            "updated_at": status.updated_at,
            "updated_by": user_data
        }), 200
    except Exception as e:
        # Log error
        print(f"Error fetching status: {e}")
        return jsonify({"error": "internal_error"}), 500

@common_bp.route('/status', methods=['POST'])
@jwt_required()
def update_status():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        # Check permissions
        allowed_roles = ['Admin', 'Incharge', 'Volunteer']
        user_role = getattr(user, 'role', None)
        if not user_role and user.roles:
            user_role = user.roles[0].name
            
        if user_role not in allowed_roles:
             return jsonify({"error": "forbidden"}), 403

        data = request.get_json()
        is_open = data.get('is_open')
        message = data.get('message', "")
        
        if is_open is None:
            return jsonify({"error": "missing_is_open"}), 400

        new_status = LibraryStatus(
            is_open=is_open,
            message=message,
            next_estimated_open_time=datetime.fromisoformat(data['next_open']) if data.get('next_open') else None,
            last_updated_by=current_user_id
        )
        db.session.add(new_status)
        
        # Log Activity
        from models.misc import ActivityLog
        action = 'LIBRARY_OPEN' if is_open else 'LIBRARY_CLOSE'
        activity = ActivityLog(
            user_id=current_user_id,
            action_type=action,
            details=f"Library {'opened' if is_open else 'closed'}: {message}",
            ip_address=request.remote_addr
        )
        db.session.add(activity)
        
        db.session.commit()
        return jsonify({"success": True, "message": "Status updated"}), 200
    except Exception as e:
        print(f"Error updating status: {e}")
        return jsonify({"error": "internal_error"}), 500

# --- Notifications ---

@common_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    current_user_id = get_jwt_identity()
    include_past = request.args.get('include_past', 'false').lower() == 'true'
    
    query = Notification.query.filter_by(user_id=current_user_id)
    
    if include_past:
        query = query.filter(Notification.archived == True)
    else:
        query = query.filter(Notification.archived == False)
        
    notifs = query.order_by(Notification.created_at.desc()).limit(50).all()
    
    result = []
    for n in notifs:
        result.append({
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "body": n.body,
            "read": n.read_flag,
            "archived": n.archived,
            "date": n.created_at,
            "related_transaction_id": n.related_transaction_id
        })
    return jsonify(result), 200

@common_bp.route('/notifications/mark-all-read', methods=['POST'])
@jwt_required()
def mark_all_read():
    current_user_id = get_jwt_identity()
    Notification.query.filter_by(user_id=current_user_id, read_flag=False).update({"read_flag": True})
    db.session.commit()
    return jsonify({"message": "All marked as read"}), 200

@common_bp.route('/notifications/clear', methods=['POST'])
@jwt_required()
def clear_notifications():
    current_user_id = get_jwt_identity()
    # Archive all non-archived notifications
    Notification.query.filter_by(user_id=current_user_id, archived=False).update({"archived": True, "read_flag": True})
    db.session.commit()
    return jsonify({"message": "Notifications cleared"}), 200

@common_bp.route('/notifications/<int:notif_id>/read', methods=['POST'])
@jwt_required()
def mark_read(notif_id):
    notif = Notification.query.get_or_404(notif_id)
    if notif.user_id != int(get_jwt_identity()):
        return jsonify({"error": "Unauthorized"}), 403
        
    notif.read_flag = True
    db.session.commit()
    return jsonify({"message": "Marked as read"}), 200

@common_bp.route('/notifications/<int:notif_id>/clear', methods=['POST'])
@jwt_required()
def clear_notification(notif_id):
    notif = Notification.query.get_or_404(notif_id)
    if notif.user_id != int(get_jwt_identity()):
        return jsonify({"error": "Unauthorized"}), 403
        
    notif.archived = True
    notif.read_flag = True
    db.session.commit()
    return jsonify({"message": "Notification cleared"}), 200

# --- Waitlist ---

@common_bp.route('/waitlist', methods=['POST'])
@jwt_required()
def join_waitlist():
    data = request.get_json()
    item_id = data.get('item_id')
    current_user_id = get_jwt_identity()
    
    item = InventoryItem.query.get_or_404(item_id)
    if item.quantity_available > 0:
        return jsonify({"error": "Item is available, please checkout directly"}), 400
        
    # Check if already in waitlist
    existing = Waitlist.query.filter_by(
        inventory_item_id=item_id,
        requester_id=current_user_id,
        status='QUEUED'
    ).first()
    
    if existing:
        return jsonify({"error": "You are already in the waitlist for this item"}), 409
        
    entry = Waitlist(
        inventory_item_id=item_id,
        requester_id=current_user_id,
        status='QUEUED'
    )
    db.session.add(entry)
    db.session.commit()
    db.session.add(entry)
    db.session.commit()
    
    # Notify current holders
    from models import Transaction
    from utils.notifications import send_notification
    
    active_txs = Transaction.query.filter(
        Transaction.inventory_item_id == item_id,
        Transaction.status.in_(['ISSUED', 'OVERDUE', 'RENEW_REQUESTED'])
    ).all()
    
    for tx in active_txs:
        send_notification(
            tx.borrower_id,
            'waitlist_alert',
            'Book Requested',
            f"Someone is waiting for {item.title}. Please return it if you are finished.",
            related_transaction_id=tx.id
        )

    return jsonify({"message": "Joined waitlist"}), 201

@common_bp.route('/departments', methods=['GET'])
def list_departments():
    depts = Department.query.all()
    return jsonify([{
        "id": d.id, 
        "name": d.name,
        "description": d.description,
        "is_active": d.is_active
    } for d in depts]), 200

@common_bp.route('/request-open', methods=['POST'])
@jwt_required()
def request_open():
    from models.misc import VolunteerSchedule
    from models.users import User, Role
    
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    today = (datetime.utcnow() + timedelta(hours=5, minutes=30)).date()
    schedule = VolunteerSchedule.query.filter_by(date=today).first()
    
    target_user_ids = set()
    is_fallback = False
    
    if schedule:
        if schedule.volunteer_1_id: target_user_ids.add(schedule.volunteer_1_id)
        if schedule.volunteer_2_id: target_user_ids.add(schedule.volunteer_2_id)
    
    # If no schedule or no volunteers assigned, fallback to Incharge AND Admin
    if not target_user_ids:
        is_fallback = True
        roles = Role.query.filter(Role.name.in_(['Incharge', 'Admin'])).all()
        for role in roles:
            for u in role.users:
                target_user_ids.add(u.id)
                
    if not target_user_ids:
         return jsonify({"message": "No volunteers, Incharges, or Admins found to notify."}), 400
         
    # Create Notifications
    count = 0
    for uid in target_user_ids:
        if uid == current_user_id: continue # Don't notify self
        
        notif = Notification(
            user_id=uid,
            type='request_open',
            title='Library Open Request',
            body=f"{user.name} ({user.roll_number}) is requesting the library to be opened." + (" (No volunteers on roster today)" if is_fallback else ""),
            read_flag=False
        )
        db.session.add(notif)
        count += 1
        
    db.session.commit()
    
    return jsonify({
        "message": f"Request sent to {count} users", 
        "fallback": is_fallback
    }), 200
