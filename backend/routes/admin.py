from flask import Blueprint, request, jsonify
import os
from datetime import datetime
from extensions import db
from models import AppSetting, User, Transaction, InventoryItem, InventoryCopy, VolunteerSchedule, Department, Role, Permission, Donor, Waitlist, Notification, AttendanceLog, ActivityLog
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
@permission_required('manage_roles')
def list_roles():
    # --- AUTO-HEAL PERMISSIONS (Duplicate of list_permissions logic) ---
    # This ensures permissions exist even if user doesn't visit /permissions
    MASTER_PERMISSIONS = [
        # Dashboard & Ops
        {"name": "update_library_status", "description": "Open/Close library and set status"},
        {"name": "view_analytics", "description": "View stats and logs"},
        {"name": "manage_roster", "description": "Manage duty roster"},
        
        # Inventory
        {"name": "manage_inventory", "description": "Add, edit, delete items"},
        {"name": "import_data", "description": "Import inventory from CSV"},
        {"name": "manage_donors", "description": "Manage donors"},
        
        # Circulation
        {"name": "approve_checkout", "description": "Approve item issuance"},
        {"name": "approve_return", "description": "Approve item returns"},
        {"name": "approve_renew", "description": "Approve renewals"},
        {"name": "staff_checkout", "description": "Self-checkout for staff"},
        
        # Users
        {"name": "approve_users", "description": "Approve new user signups"},
        {"name": "manage_users", "description": "Edit/Block users"},
        {"name": "manage_roles", "description": "Configure roles and permissions"},
        {"name": "manage_departments", "description": "Manage departments"},
        
        # System
        {"name": "manage_settings", "description": "System settings"},
        {"name": "manage_system_reset", "description": "Database reset actions"}
    ]
    
    existing_perms = {p.name for p in Permission.query.all()}
    added_new = False
    for p_def in MASTER_PERMISSIONS:
        if p_def['name'] not in existing_perms:
            new_perm = Permission(name=p_def['name'], description=p_def['description'])
            db.session.add(new_perm)
            added_new = True
            
    if added_new:
        db.session.commit()
    # -------------------------------------------------------------------

    roles = Role.query.all()
    # Serialize including permissions
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
@permission_required('manage_roles')
def list_permissions():
    # Define Source of Truth for Permissions
    MASTER_PERMISSIONS = [
        # Dashboard & Ops
        {"name": "update_library_status", "description": "Open/Close library and set status"},
        {"name": "view_analytics", "description": "View stats and logs"},
        {"name": "manage_roster", "description": "Manage duty roster"},
        
        # Inventory
        {"name": "manage_inventory", "description": "Add, edit, delete items"},
        {"name": "import_data", "description": "Import inventory from CSV"},
        {"name": "manage_donors", "description": "Manage donors"},
        
        # Circulation
        {"name": "approve_checkout", "description": "Approve item issuance"},
        {"name": "approve_return", "description": "Approve item returns"},
        {"name": "approve_renew", "description": "Approve renewals"},
        {"name": "staff_checkout", "description": "Self-checkout for staff"},
        
        # Users
        {"name": "approve_users", "description": "Approve new user signups"},
        {"name": "manage_users", "description": "Edit/Block users"},
        {"name": "manage_roles", "description": "Configure roles and permissions"},
        {"name": "manage_departments", "description": "Manage departments"},
        
        # System
        {"name": "manage_settings", "description": "System settings"},
        {"name": "manage_system_reset", "description": "Database reset actions"}
    ]

    # Self-Healing: Check and create missing permissions
    existing_perms = {p.name for p in Permission.query.all()}
    added_new = False
    
    for p_def in MASTER_PERMISSIONS:
        if p_def['name'] not in existing_perms:
            new_perm = Permission(name=p_def['name'], description=p_def['description'])
            db.session.add(new_perm)
            added_new = True
            
    if added_new:
        db.session.commit()

    # Return all
    perms = Permission.query.all()
    return jsonify([{"id": p.id, "name": p.name} for p in perms]), 200

@admin_bp.route('/roles/permissions', methods=['POST'])
@jwt_required()
@permission_required('manage_roles')
def update_role_permissions():
    data = request.get_json()
    role_name = data.get('role')
    perm_names = data.get('permissions', [])
    
    role = Role.query.filter_by(name=role_name).first()
    if not role:
        return jsonify({"error": "Role not found"}), 404
        
    # Clear existing
    role.permissions = []
    
    # Add new
    for pname in perm_names:
        perm = Permission.query.filter_by(name=pname).first()
        if perm:
            role.permissions.append(perm)
            
    db.session.commit()
    return jsonify({"message": f"Permissions updated for {role_name}"}), 200

@admin_bp.route('/roles/<int:role_id>/permissions', methods=['POST'])
@jwt_required()
@permission_required('manage_roles')
def update_role_permissions_by_id(role_id):
    role = Role.query.get_or_404(role_id)
    data = request.get_json()
    perm_names = data.get('permissions', [])
    
    # Clear existing
    role.permissions = []
    
    # Add new
    for pname in perm_names:
        perm = Permission.query.filter_by(name=pname).first()
        if perm:
            role.permissions.append(perm)
            
    db.session.commit()
    return jsonify({"message": f"Permissions updated for {role.name}"}), 200

@admin_bp.route('/users/<int:user_id>/role', methods=['POST'])
@jwt_required()
def assign_role(user_id):
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
        
        # Allow if they have specific permission OR 'manage_users' (but not for Admin role)
        if perm_name in perms:
            can_assign = True
        elif 'manage_users' in perms and role_name != 'Admin':
            can_assign = True
            
    if not can_assign:
        return jsonify({"error": "You do not have permission to assign this role"}), 403

    # Secure Admin Assignment
    if role_name == 'Admin':
        secret_key = data.get('secret_key')
        # Use env var or strictly fallback. 
        # Ideally, force env var, but for this context, fallback is user-friendly.
        valid_key = os.environ.get('ADMIN_SECRET_KEY')
        valid_key = os.environ.get('ADMIN_SECRET_KEY') or 'KumarLibraryVel@2495' # Fallback provided by user
        if not valid_key:
             return jsonify({"error": "Admin Secret Key not configured on server"}), 500 
        if secret_key != valid_key:
             return jsonify({"error": "Invalid Admin Secret Key"}), 403

    # Perform Assignment
    if role not in target_user.roles:
        target_user.roles.append(role)
        db.session.commit()
        
    return jsonify({"message": f"Role {role_name} assigned to {target_user.name}"}), 200

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

# ==========================================
# SYSTEM RESET & CLEANUP (DANGER ZONE)
# ==========================================

@admin_bp.route('/system/reset-transactions', methods=['POST'])
@jwt_required()
def reset_transactions():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # 1. Permission Check
    # get_all_permissions returns a list of strings
    if 'manage_system_reset' not in user.get_all_permissions():
         return jsonify({"error": "Permission denied"}), 403

    data = request.json
    secret_key = data.get('secret_key')
    reset_type = data.get('type') # 'all', 'date', or 'history'

    # 2. Secret Key Check
    valid_key = os.environ.get('ADMIN_SECRET_KEY')
    if not valid_key:
        return jsonify({"error": "Admin Secret Key not configured on server"}), 500
    if secret_key != valid_key:
        return jsonify({"error": "Invalid Admin Secret Key"}), 403

    try:
        if reset_type == 'all':
            # Force Return ALL borrowed items
            # Statuses that imply possession: ISSUED, OVERDUE, RETURN_REQUESTED, RENEW_REQUESTED
            active_statuses = ['ISSUED', 'OVERDUE', 'RETURN_REQUESTED', 'RENEW_REQUESTED']
            active_txs = Transaction.query.filter(Transaction.status.in_(active_statuses)).all()
            count = 0
            for tx in active_txs:
                tx.status = 'RETURNED'
                tx.return_date = datetime.utcnow()
                item = InventoryItem.query.get(tx.inventory_item_id)
                if item:
                    item.quantity_available += 1
                
                if tx.copy_id:
                    copy = InventoryCopy.query.get(tx.copy_id)
                    if copy:
                        copy.status = 'AVAILABLE'
                        copy.current_holder_id = None

                count += 1
            
            db.session.commit()
            return jsonify({"message": f"Successfully forced return for {count} transactions. Inventory updated."}), 200

        elif reset_type == 'date':
             # Clear transactions for a particular date (Delete history?)
            target_date_str = data.get('date')
            if not target_date_str:
                return jsonify({"error": "Date is required"}), 400
            
            target_date = datetime.strptime(target_date_str, '%Y-%m-%d').date()
            
            # Delete transactions created on this date
            txs_to_delete = Transaction.query.filter(
                db.func.date(Transaction.issue_date) == target_date
            ).all()

            count = 0
            for tx in txs_to_delete:
                # If valid active transaction, return inventory
                active_statuses = ['ISSUED', 'OVERDUE', 'RETURN_REQUESTED', 'RENEW_REQUESTED']
                if tx.status in active_statuses:
                    item = InventoryItem.query.get(tx.inventory_item_id)
                    if item:
                         item.quantity_available += 1
                    
                    if tx.copy_id:
                        copy = InventoryCopy.query.get(tx.copy_id)
                        if copy:
                            copy.status = 'AVAILABLE'
                            copy.current_holder_id = None
                
                db.session.delete(tx)
                count += 1
            
            db.session.commit()
            return jsonify({"message": f"Deleted {count} transactions for {target_date_str}"}), 200

        elif reset_type == 'history':
            # Clear ALL transaction history (Delete All Rows)
            # This is a full wipe.
            all_txs = Transaction.query.all()
            count = len(all_txs)
            
            # Safety first: Restore inventory for any active ones before deleting?
            # User probably wants a clean slate. 
            # If we delete history, we assume inventory is either also being reset or we should restore it.
            # Let's restore inventory for actives to be safe, then delete.
            
            for tx in all_txs:
                active_statuses = ['ISSUED', 'OVERDUE', 'RETURN_REQUESTED', 'RENEW_REQUESTED']
                if tx.status in active_statuses:
                    item = InventoryItem.query.get(tx.inventory_item_id)
                    if item:
                         item.quantity_available += 1
                    
                    if tx.copy_id:
                        copy = InventoryCopy.query.get(tx.copy_id)
                        if copy:
                            copy.status = 'AVAILABLE'
                            copy.current_holder_id = None
                
                db.session.delete(tx)

            db.session.commit()
            return jsonify({"message": f"Permanently deleted all {count} transaction records."}), 200
        
        return jsonify({"error": "Invalid reset type"}), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/system/delete-users', methods=['POST'])
@jwt_required()
def delete_users():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    # 1. Permission Check
    if 'manage_system_reset' not in user.get_all_permissions():
         return jsonify({"error": "Permission denied"}), 403

    data = request.json
    secret_key = data.get('secret_key')

    # 2. Secret Key Check
    valid_key = os.environ.get('ADMIN_SECRET_KEY')
    if not valid_key:
        return jsonify({"error": "Admin Secret Key not configured on server"}), 500
    if secret_key != valid_key:
        return jsonify({"error": "Invalid Admin Secret Key"}), 403


    try:
        # Delete all users EXCEPT Admin
        # Fetch all users first, then filter in Python to ensure 'role' property is respected
        # (Since User.role is a property, not a column, SQL filter failed)
        all_users = User.query.all()
        users_to_delete = [u for u in all_users if u.role != 'Admin']
        count = len(users_to_delete)
        
        for u in users_to_delete:
            # 1. Restore Inventory for Active Transactions
            active_txs = Transaction.query.filter_by(borrower_id=u.id, status='ISSUED').all()
            for tx in active_txs:
                item = InventoryItem.query.get(tx.inventory_item_id)
                if item:
                    item.quantity_available += 1

                if tx.copy_id:
                    copy = InventoryCopy.query.get(tx.copy_id)
                    if copy:
                        copy.status = 'AVAILABLE'
                        copy.current_holder_id = None
            
            # 2. Delete All Transactions (History & Active)
            Transaction.query.filter((Transaction.borrower_id == u.id) | 
                                     (Transaction.requested_by_id == u.id) |
                                     (Transaction.approved_by_id == u.id) |
                                     (Transaction.rejected_by_id == u.id) |
                                     (Transaction.processed_by_id == u.id)).delete()

            # 3. Delete Waitlist
            Waitlist.query.filter_by(requester_id=u.id).delete()

            # 4. Delete Notifications
            Notification.query.filter_by(user_id=u.id).delete()

            # 5. Delete Attendance Logs
            AttendanceLog.query.filter_by(user_id=u.id).delete()

            # 6. Delete Activity Logs
            ActivityLog.query.filter_by(user_id=u.id).delete()

            # 7. Unlink from VolunteerSchedule (Set to None instead of delete schedule?)
            # If we delete schedule, we lose record of 'someone' being there. 
            # Better to set to None.
            schedules = VolunteerSchedule.query.filter((VolunteerSchedule.volunteer_1_id == u.id) | (VolunteerSchedule.volunteer_2_id == u.id)).all()
            for s in schedules:
                if s.volunteer_1_id == u.id: s.volunteer_1_id = None
                if s.volunteer_2_id == u.id: s.volunteer_2_id = None
            
            # 8. Delete User
            db.session.delete(u)
            
        db.session.commit()
        return jsonify({"message": f"Deleted {count} non-admin users. Inventory restored. All related data wiped."}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
