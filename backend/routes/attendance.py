from flask import Blueprint, request, jsonify
from extensions import db
from models.misc import AttendanceLog, VolunteerSchedule
from models.users import User
from datetime import datetime, timedelta
from flask_jwt_extended import jwt_required, get_jwt_identity

def get_today_date():
    # IST is UTC + 5:30
    now_ist = datetime.utcnow() + timedelta(hours=5, minutes=30)
    # Logical Day: If before 4 AM, count as previous day
    if now_ist.hour < 4:
        return (now_ist - timedelta(days=1)).date()
    return now_ist.date()

attendance_bp = Blueprint('attendance', __name__)

@attendance_bp.route('/status', methods=['GET'])
@jwt_required()
def get_status():
    current_user_id = int(get_jwt_identity())
    today = get_today_date()
    
    # Check if scheduled today
    schedule = VolunteerSchedule.query.filter_by(date=today).filter(
        (VolunteerSchedule.volunteer_1_id == current_user_id) | 
        (VolunteerSchedule.volunteer_2_id == current_user_id)
    ).first()
    
    is_scheduled = True if schedule else False
    
    # Check active log
    log = AttendanceLog.query.filter_by(user_id=current_user_id, date=today).first()
    
    return jsonify({
        "is_scheduled": is_scheduled,
        "schedule_details": {
            "department": schedule.department_id if schedule else None,
            "partner_id": (schedule.volunteer_2_id if schedule.volunteer_1_id == current_user_id else schedule.volunteer_1_id) if schedule else None
        } if schedule else None,
        "log": {
            "id": log.id,
            "check_in": log.check_in_time.isoformat(),
            "check_out": log.check_out_time.isoformat() if log.check_out_time else None,
            "status": log.status,
            "duration": log.duration_minutes
        } if log else None
    }), 200

@attendance_bp.route('/check-in', methods=['POST'])
@jwt_required()
def check_in():
    current_user_id = int(get_jwt_identity())
    today = get_today_date()
    
    # Verify Schedule
    schedule = VolunteerSchedule.query.filter_by(date=today).filter(
        (VolunteerSchedule.volunteer_1_id == current_user_id) | 
        (VolunteerSchedule.volunteer_2_id == current_user_id)
    ).first()
    
    if not schedule:
        return jsonify({"error": "You are not scheduled for duty today."}), 403
        
    # Check existing
    existing = AttendanceLog.query.filter_by(user_id=current_user_id, date=today).first()
    if existing:
        return jsonify({"error": "You have already checked in today."}), 400
        
    log = AttendanceLog(
        user_id=current_user_id,
        date=today,
        check_in_time=datetime.utcnow(),
        status='ACTIVE'
    )
    
    db.session.add(log)
    
    # Log Activity
    from models.misc import ActivityLog
    activity = ActivityLog(
        user_id=current_user_id,
        action_type='PUNCH_IN',
        details=f"Checked in at {log.check_in_time.strftime('%H:%M')}",
        ip_address=request.remote_addr
    )
    db.session.add(activity)
    
    db.session.commit()
    
    return jsonify({"message": "Checked in successfully", "time": log.check_in_time.isoformat()}), 200

@attendance_bp.route('/check-out', methods=['POST'])
@jwt_required()
def check_out():
    current_user_id = int(get_jwt_identity())
    today = get_today_date()
    
    log = AttendanceLog.query.filter_by(user_id=current_user_id, date=today, status='ACTIVE').first()
    
    if not log:
        return jsonify({"error": "No active check-in found."}), 404
        
    log.check_out_time = datetime.utcnow()
    log.status = 'COMPLETED'
    
    # Calculate duration
    duration = (log.check_out_time - log.check_in_time).total_seconds() / 60
    log.duration_minutes = int(duration)
    
    # Log Activity
    from models.misc import ActivityLog
    activity = ActivityLog(
        user_id=current_user_id,
        action_type='PUNCH_OUT',
        details=f"Checked out at {log.check_out_time.strftime('%H:%M')}. Duration: {int(duration)} min",
        ip_address=request.remote_addr
    )
    db.session.add(activity)
    
    db.session.commit()
    
    return jsonify({
        "message": "Checked out successfully", 
        "time": log.check_out_time.isoformat(),
        "duration": log.duration_minutes
    }), 200

@attendance_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    current_user_id = get_jwt_identity()
    logs = AttendanceLog.query.filter_by(user_id=current_user_id).order_by(AttendanceLog.date.desc()).limit(30).all()
    
    return jsonify([{
        "date": l.date.isoformat(),
        "check_in": l.check_in_time.isoformat(),
        "check_out": l.check_out_time.isoformat() if l.check_out_time else None,
        "duration": l.duration_minutes,
        "status": l.status
    } for l in logs]), 200

@attendance_bp.route('/active', methods=['GET'])
@jwt_required()
def get_active_attendance():
    # Get all active logs for today
    today = get_today_date()
    logs = AttendanceLog.query.filter_by(date=today, status='ACTIVE').all()
    
    active_users = []
    for log in logs:
        if log.user:
            active_users.append({
                "id": log.user.id,
                "name": log.user.name,
                "check_in": log.check_in_time.isoformat()
            })
            
    return jsonify(active_users), 200
