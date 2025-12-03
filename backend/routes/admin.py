from flask import Blueprint, request, jsonify
from extensions import db
from models import AppSetting, User, Transaction, InventoryItem, VolunteerSchedule, Department, Role, Permission, Donor
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from utils.decorators import role_required, permission_required

admin_bp = Blueprint('admin', __name__)

# --- Settings ---

@admin_bp.route('/settings', methods=['GET'])
@jwt_required()
@permission_required('manage_settings')
def get_settings():
    settings = AppSetting.query.all()
    return jsonify({s.key: s.value for s in settings}), 200

@admin_bp.route('/settings', methods=['POST'])
@jwt_required()
@permission_required('manage_settings')
def update_settings():
    data = request.get_json()
    for key, value in data.items():
        setting = AppSetting.query.get(key)
        if setting:
            setting.value = str(value)
            setting.updated_by_id = get_jwt_identity()
            setting.updated_at = datetime.utcnow()
        else:
            # Create new setting if allowed, or ignore
            pass
    db.session.commit()
    return jsonify({"message": "Settings updated"}), 200

# --- Analytics ---

@admin_bp.route('/analytics', methods=['GET'])
@jwt_required()
@permission_required('view_analytics')
def get_analytics():
    total_users = User.query.count()
    active_checkouts = Transaction.query.filter_by(status='ISSUED').count()
    overdue_items = Transaction.query.filter(Transaction.status == 'ISSUED', Transaction.due_date < datetime.utcnow()).count()
    
    # Simple stats for now
    return jsonify({
        "total_users": total_users,
        "active_checkouts": active_checkouts,
        "overdue_items": overdue_items
    }), 200

# --- Roster ---

@admin_bp.route('/roster', methods=['GET'])
@jwt_required()
def get_roster():
    # Get roster for next 7 days
    today = datetime.utcnow().date()
    roster = VolunteerSchedule.query.filter(VolunteerSchedule.date >= today).order_by(VolunteerSchedule.date).limit(7).all()
    
    result = []
    for r in roster:
        result.append({
            "date": r.date.strftime('%Y-%m-%d'),
            "department_id": r.department_id,
            "department": Department.query.get(r.department_id).name if r.department_id else None,
            "volunteers": [
                {"id": r.volunteer_1_id, "name": User.query.get(r.volunteer_1_id).name} if r.volunteer_1_id else None,
                {"id": r.volunteer_2_id, "name": User.query.get(r.volunteer_2_id).name} if r.volunteer_2_id else None
            ]
        })
    return jsonify(result), 200

@admin_bp.route('/roster', methods=['POST'])
@jwt_required()
@role_required(['Admin', 'Incharge'])
def update_roster():
    data = request.get_json()
    date_str = data.get('date')
    dept_id = data.get('department_id')
    v1_id = data.get('volunteer_1_id')
    v2_id = data.get('volunteer_2_id')
    
    date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
    
    entry = VolunteerSchedule.query.filter_by(date=date_obj).first()
    if not entry:
        entry = VolunteerSchedule(date=date_obj)
        db.session.add(entry)
        
    entry.department_id = dept_id
    entry.volunteer_1_id = v1_id
    entry.volunteer_2_id = v2_id
    entry.created_by = get_jwt_identity()
    
    db.session.commit()
    return jsonify({"message": "Roster updated"}), 200

# --- Roles & Permissions ---

@admin_bp.route('/roles', methods=['GET'])
@jwt_required()
@role_required(['Admin'])
def get_roles():
    roles = Role.query.all()
    result = []
    for r in roles:
        result.append({
            "id": r.id,
            "name": r.name,
            "permissions": [p.name for p in r.permissions]
        })
    return jsonify(result), 200

@admin_bp.route('/permissions', methods=['GET'])
@jwt_required()
@role_required(['Admin'])
def get_permissions():
    perms = Permission.query.all()
    return jsonify([{"id": p.id, "name": p.name, "description": p.description} for p in perms]), 200

@admin_bp.route('/roles/<int:role_id>/permissions', methods=['POST'])
@jwt_required()
@role_required(['Admin'])
def update_role_permissions(role_id):
    role = Role.query.get_or_404(role_id)
    data = request.get_json()
    perm_names = data.get('permissions', [])
    
    # Clear existing permissions
    role.permissions = []
    
    for name in perm_names:
        perm = Permission.query.filter_by(name=name).first()
        if perm:
            role.permissions.append(perm)
            
    db.session.commit()
    return jsonify({"message": "Role permissions updated"}), 200

# --- Departments ---

@admin_bp.route('/departments', methods=['POST'])
@jwt_required()
@role_required(['Admin'])
def add_department():
    data = request.get_json()
    if not data.get('name'):
        return jsonify({"error": "Name is required"}), 400
        
    if Department.query.filter_by(name=data['name']).first():
        return jsonify({"error": "Department already exists"}), 400
        
    new_dept = Department(name=data['name'])
    db.session.add(new_dept)
    db.session.commit()
    return jsonify({"message": "Department added", "id": new_dept.id}), 201

@admin_bp.route('/departments/<int:dept_id>', methods=['DELETE'])
@jwt_required()
@role_required(['Admin'])
def delete_department(dept_id):
    dept = Department.query.get_or_404(dept_id)
    # Check if used? For now just delete or handle error if FK constraint fails
    try:
        db.session.delete(dept)
        db.session.commit()
        return jsonify({"message": "Department deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Cannot delete department as it is in use"}), 400

@admin_bp.route('/departments/<int:dept_id>', methods=['PUT'])
@jwt_required()
@role_required(['Admin'])
def update_department(dept_id):
    dept = Department.query.get_or_404(dept_id)
    data = request.get_json()
    
    if 'name' in data:
        dept.name = data['name']
    if 'description' in data:
        dept.description = data['description']
    if 'is_active' in data:
        dept.is_active = data['is_active']
        
    db.session.commit()
    return jsonify({"message": "Department updated"}), 200

# --- Donors ---

@admin_bp.route('/donors', methods=['GET'])
@jwt_required()
@role_required(['Admin', 'Incharge'])
def list_donors():
    donors = Donor.query.all()
    return jsonify([{
        "id": d.id,
        "name": d.name,
        "branch": d.branch,
        "batch": d.batch,
        "mobile_number": d.mobile_number,
        "email": d.email,
        "address": d.address
    } for d in donors]), 200

@admin_bp.route('/donors', methods=['POST'])
@jwt_required()
@role_required(['Admin'])
def add_donor():
    data = request.get_json()
    required = ['name', 'branch', 'batch']
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400
            
    new_donor = Donor(
        name=data['name'],
        branch=data['branch'],
        batch=data['batch'],
        mobile_number=data.get('mobile_number'),
        email=data.get('email'),
        address=data.get('address')
    )
    db.session.add(new_donor)
    db.session.commit()
    return jsonify({"message": "Donor added", "id": new_donor.id}), 201

@admin_bp.route('/donors/<int:donor_id>', methods=['PUT'])
@jwt_required()
@role_required(['Admin'])
def update_donor(donor_id):
    donor = Donor.query.get_or_404(donor_id)
    data = request.get_json()
    
    if 'name' in data: donor.name = data['name']
    if 'branch' in data: donor.branch = data['branch']
    if 'batch' in data: donor.batch = data['batch']
    if 'mobile_number' in data: donor.mobile_number = data['mobile_number']
    if 'email' in data: donor.email = data['email']
    if 'address' in data: donor.address = data['address']
    
    db.session.commit()
    return jsonify({"message": "Donor updated"}), 200

@admin_bp.route('/donors/<int:donor_id>', methods=['DELETE'])
@jwt_required()
@role_required(['Admin'])
def delete_donor(donor_id):
    donor = Donor.query.get_or_404(donor_id)
    try:
        db.session.delete(donor)
        db.session.commit()
        return jsonify({"message": "Donor deleted"}), 200
    except:
        db.session.rollback()
        return jsonify({"error": "Cannot delete donor with associated items"}), 400
