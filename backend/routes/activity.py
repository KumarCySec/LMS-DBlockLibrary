from flask import Blueprint, request, jsonify
from extensions import db
from models.misc import ActivityLog
from models.users import User
from flask_jwt_extended import jwt_required
from utils.decorators import permission_required

activity_bp = Blueprint('activity', __name__)

@activity_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('view_analytics')
def get_activity_logs():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    action_type = request.args.get('type')
    user_id = request.args.get('user_id')
    date_str = request.args.get('date')
    
    query = ActivityLog.query
    
    if action_type:
        query = query.filter_by(action_type=action_type)
    if user_id:
        query = query.filter_by(user_id=user_id)
    if date_str:
        try:
            from datetime import datetime, timedelta
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
            next_day = date_obj + timedelta(days=1)
            query = query.filter(ActivityLog.created_at >= date_obj, ActivityLog.created_at < next_day)
        except ValueError:
            pass # Ignore invalid date
        
    pagination = query.order_by(ActivityLog.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    
    logs = []
    for log in pagination.items:
        logs.append({
            "id": log.id,
            "user": log.user.name if log.user else "Unknown",
            "action": log.action_type,
            "details": log.details,
            "ip": log.ip_address,
            "created_at": log.created_at.isoformat()
        })
        
    return jsonify({
        "logs": logs,
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page
    }), 200
