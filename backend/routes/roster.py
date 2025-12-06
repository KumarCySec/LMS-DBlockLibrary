from flask import Blueprint, request, jsonify
from extensions import db
from models.misc import VolunteerSchedule
from models.users import User
from models.inventory import Department
from datetime import datetime, date, timedelta
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.decorators import permission_required

roster_bp = Blueprint('roster', __name__)

@roster_bp.route('/', methods=['GET'])
@jwt_required()
def get_roster():
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    
    query = VolunteerSchedule.query
    
    if start_date_str:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        query = query.filter(VolunteerSchedule.date >= start_date)
        
    if end_date_str:
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        query = query.filter(VolunteerSchedule.date <= end_date)
    else:
        # Default to next 30 days if no end date
        if not start_date_str:
            today = datetime.now().date()
            query = query.filter(VolunteerSchedule.date >= today)
            
    schedules = query.order_by(VolunteerSchedule.date).all()
    
    result = []
    for s in schedules:
        dept = Department.query.get(s.department_id)
        v1 = User.query.get(s.volunteer_1_id)
        v2 = User.query.get(s.volunteer_2_id) if s.volunteer_2_id else None
        
        result.append({
            "id": s.id,
            "date": s.date.isoformat(),
            "department": {"id": dept.id, "name": dept.name} if dept else None,
            "volunteer1": {"id": v1.id, "name": v1.name, "phone": v1.phone_number, "email": v1.email} if v1 else None,
            "volunteer2": {"id": v2.id, "name": v2.name, "phone": v2.phone_number, "email": v2.email} if v2 else None
        })
        
    return jsonify(result), 200

@roster_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('manage_roster')
def update_roster():
    data = request.get_json()
    date_str = data.get('date')
    dept_id = data.get('department_id')
    v1_id = data.get('volunteer_1_id')
    v2_id = data.get('volunteer_2_id')
    
    if not date_str or not dept_id or not v1_id:
        return jsonify({"error": "Date, Department, and at least Volunteer 1 are required"}), 400
        
    target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    
    # Check existing
    schedule = VolunteerSchedule.query.filter_by(date=target_date).first()
    if not schedule:
        schedule = VolunteerSchedule(date=target_date)
        db.session.add(schedule)
        
    schedule.department_id = dept_id
    schedule.volunteer_1_id = v1_id
    schedule.volunteer_2_id = v2_id
    schedule.created_by = get_jwt_identity()
    
    db.session.commit()
    
    return jsonify({"message": "Roster updated successfully"}), 200

@roster_bp.route('/today', methods=['GET'])
def get_today_roster():
    # IST Fix
    today = (datetime.utcnow() + timedelta(hours=5, minutes=30)).date()
    s = VolunteerSchedule.query.filter_by(date=today).first()
    
    if not s:
        return jsonify(None), 200
        
    dept = Department.query.get(s.department_id)
    v1 = User.query.get(s.volunteer_1_id)
    v2 = User.query.get(s.volunteer_2_id) if s.volunteer_2_id else None
    
    return jsonify({
        "date": s.date.isoformat(),
        "department": {"id": dept.id, "name": dept.name} if dept else None,
        "volunteer1": {"id": v1.id, "name": v1.name, "phone": v1.phone_number, "email": v1.email} if v1 else None,
        "volunteer2": {"id": v2.id, "name": v2.name, "phone": v2.phone_number, "email": v2.email} if v2 else None
    }), 200
