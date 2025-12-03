from flask import Blueprint, request, jsonify
from extensions import db
from models import LibraryStatus, Notification, Waitlist, User, InventoryItem, Department
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from utils.decorators import role_required, permission_required

common_bp = Blueprint('common', __name__)

# --- Library Status ---

@common_bp.route('/status', methods=['GET'])
def get_status():
    status = LibraryStatus.query.order_by(LibraryStatus.updated_at.desc()).first()
    if not status:
        return jsonify({"is_open": False, "message": "Status not set"}), 200
    return jsonify({
        "is_open": status.is_open,
        "message": status.message,
        "next_open": status.next_estimated_open_time
    }), 200

@common_bp.route('/status', methods=['POST'])
@jwt_required()
@permission_required('update_library_status')
def update_status():
    data = request.get_json()
    new_status = LibraryStatus(
        is_open=data.get('is_open', False),
        message=data.get('message'),
        next_estimated_open_time=datetime.fromisoformat(data['next_open']) if data.get('next_open') else None,
        last_updated_by=get_jwt_identity()
    )
    db.session.add(new_status)
    db.session.commit()
    return jsonify({"message": "Status updated"}), 200

# --- Notifications ---

@common_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    current_user_id = get_jwt_identity()
    notifs = Notification.query.filter_by(user_id=current_user_id).order_by(Notification.created_at.desc()).limit(50).all()
    
    result = []
    for n in notifs:
        result.append({
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "body": n.body,
            "read": n.read_flag,
            "date": n.created_at
        })
    return jsonify(result), 200

@common_bp.route('/notifications/<int:notif_id>/read', methods=['POST'])
@jwt_required()
def mark_read(notif_id):
    notif = Notification.query.get_or_404(notif_id)
    if notif.user_id != int(get_jwt_identity()):
        return jsonify({"error": "Unauthorized"}), 403
        
    notif.read_flag = True
    db.session.commit()
    return jsonify({"message": "Marked as read"}), 200

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
        
    entry = Waitlist(
        inventory_item_id=item_id,
        requester_id=current_user_id,
        status='QUEUED'
    )
    db.session.add(entry)
    db.session.commit()
    db.session.add(entry)
    db.session.commit()
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
