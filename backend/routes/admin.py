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
            # Create new setting if it doesn't exist
            setting = AppSetting(key=key, value=str(value))
            setting.updated_by_id = get_jwt_identity()
            setting.updated_at = datetime.utcnow()
            db.session.add(setting)
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
        v1 = User.query.get(r.volunteer_1_id) if r.volunteer_1_id else None
        v2 = User.query.get(r.volunteer_2_id) if r.volunteer_2_id else None
        dept = Department.query.get(r.department_id) if r.department_id else None

        result.append({
            "date": r.date.strftime('%Y-%m-%d'),
            "department_id": r.department_id,
            "department": dept.name if dept else None,
            "volunteers": [
                {"id": v1.id, "name": v1.name} if v1 else None,
                {"id": v2.id, "name": v2.name} if v2 else None
            ]
        })
    return jsonify(result), 200

@admin_bp.route('/roster', methods=['POST'])
@jwt_required()
@permission_required('manage_roster')
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
@permission_required('manage_roles_permissions')
def get_roles():
    try:
        roles = Role.query.all()
        result = []
        for r in roles:
            perms = []
            if hasattr(r, 'permissions'):
                try:
                    perms = [p.name for p in r.permissions]
                except:
                    perms = []
            
            result.append({
                "id": r.id,
                "name": r.name,
                "permissions": perms
            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch roles", "details": str(e)}), 500

@admin_bp.route('/permissions', methods=['GET'])
@jwt_required()
@permission_required('manage_roles_permissions')
def get_permissions():
    try:
        perms = Permission.query.all()
        return jsonify([{
            "id": p.id, 
            "name": p.name, 
            "description": getattr(p, "description", "")
        } for p in perms]), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch permissions", "details": str(e)}), 500

@admin_bp.route('/roles/<int:role_id>/permissions', methods=['POST'])
@jwt_required()
@permission_required('manage_roles_permissions')
def update_role_permissions(role_id):
    role = Role.query.get_or_404(role_id)
    
    if role.name == 'Admin':
        return jsonify({"error": "Admin role cannot be modified."}), 403
        
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

# --- User Role Management ---

@admin_bp.route('/users/<int:user_id>/role', methods=['POST'])
@jwt_required()
def change_user_role(user_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    target_user = User.query.get_or_404(user_id)
    
    data = request.get_json()
    role_name = data.get('role')
    
    if not role_name:
        return jsonify({"error": "Role name is required"}), 400
        
    role = Role.query.filter_by(name=role_name).first()
    if not role:
        return jsonify({"error": "Role not found"}), 404
        
    # Permission Checks
    can_assign = False
    
    # Admin can assign anything
    if current_user.role == 'Admin':
        can_assign = True
    else:
        # Check for specific permission like 'assign_role_volunteer'
        perm_name = f"assign_role_{role_name.lower()}"
        perms = current_user.get_all_permissions()
        if perm_name in perms:
            can_assign = True
            
    if not can_assign:
        return jsonify({"error": "You do not have permission to assign this role"}), 403

    # Prevent removing own Admin role if it's the last admin (optional safety)
    # But mainly prevent removing own Admin role at all if you are the target
    if str(target_user.id) == str(current_user_id) and target_user.role == 'Admin' and role_name != 'Admin':
         return jsonify({"error": "Cannot remove your own Admin role"}), 403

    # Replace roles
    target_user.roles = [role]
    db.session.commit()
        
    return jsonify({"message": f"User role updated to {role_name}"}), 200

# --- Departments ---

@admin_bp.route('/departments', methods=['POST'])
@jwt_required()
@permission_required('manage_departments')
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
@permission_required('manage_departments')
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
@permission_required('manage_departments')
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
@permission_required('manage_donors')
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
@permission_required('manage_donors')
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
@permission_required('manage_donors')
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
@permission_required('manage_donors')
def delete_donor(donor_id):
    donor = Donor.query.get_or_404(donor_id)
    try:
        db.session.delete(donor)
        db.session.commit()
        return jsonify({"message": "Donor deleted"}), 200
    except:
        db.session.rollback()
        return jsonify({"error": "Cannot delete donor with associated items"}), 400
