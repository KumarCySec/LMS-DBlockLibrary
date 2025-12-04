from flask import Blueprint, request, jsonify
from extensions import db
from models.misc import AttendanceLog, VolunteerSchedule
from models.users import User
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt_identity

attendance_bp = Blueprint('attendance', __name__)

@attendance_bp.route('/status', methods=['GET'])
@jwt_required()
def get_status():
    current_user_id = get_jwt_identity()
    today = datetime.utcnow().date()
    
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
    current_user_id = get_jwt_identity()
    today = datetime.utcnow().date()
    
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
    db.session.commit()
    
    return jsonify({"message": "Checked in successfully", "time": log.check_in_time.isoformat()}), 200

@attendance_bp.route('/check-out', methods=['POST'])
@jwt_required()
def check_out():
    current_user_id = get_jwt_identity()
    today = datetime.utcnow().date()
    
    log = AttendanceLog.query.filter_by(user_id=current_user_id, date=today, status='ACTIVE').first()
    
    if not log:
        return jsonify({"error": "No active check-in found."}), 404
        
    log.check_out_time = datetime.utcnow()
    log.status = 'COMPLETED'
    
    # Calculate duration
    duration = (log.check_out_time - log.check_in_time).total_seconds() / 60
    log.duration_minutes = int(duration)
    
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
