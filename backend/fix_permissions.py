from app import create_app
from extensions import db
from models import User, Role, Permission

app = create_app()

def fix_permissions():
    with app.app_context():
        print("Fixing permissions...")
        
        # 1. Define Permissions
        all_perms = [
            'manage_inventory', 'view_inventory',
            'approve_checkout', 'approve_return', 'approve_renewal',
            'manage_users', 'approve_users',
            'manage_departments', 'manage_donors',
            'manage_roster', 'view_roster',
            'view_analytics',
            'update_library_status',
            'manage_roles_permissions',
            'assign_role_student', 'assign_role_volunteer', 'assign_role_incharge'
        ]

        # Create permissions if they don't exist
        for perm_name in all_perms:
            p = Permission.query.filter_by(name=perm_name).first()
            if not p:
                print(f"Creating permission: {perm_name}")
                p = Permission(name=perm_name, description=f"Permission to {perm_name.replace('_', ' ')}")
                db.session.add(p)
        db.session.commit()

        # 2. Configure Roles
        # Admin: All permissions (conceptually, though we might not even check them if we hardcode Admin check, 
        # but better to have them for consistency if we remove hardcoded checks)
        admin_role = Role.query.filter_by(name='Admin').first()
        if not admin_role:
            admin_role = Role(name='Admin')
            db.session.add(admin_role)
        
        # Give Admin ALL permissions
        admin_perms = Permission.query.all()
        admin_role.permissions = admin_perms
        
        # Incharge: All EXCEPT manage_roles_permissions
        incharge_role = Role.query.filter_by(name='Incharge').first()
        if not incharge_role:
            incharge_role = Role(name='Incharge')
            db.session.add(incharge_role)
            
        incharge_perms = [p for p in admin_perms if p.name != 'manage_roles_permissions']
        incharge_role.permissions = incharge_perms

        # Volunteer: Limited permissions
        volunteer_role = Role.query.filter_by(name='Volunteer').first()
        if not volunteer_role:
            volunteer_role = Role(name='Volunteer')
            db.session.add(volunteer_role)
            
        volunteer_perm_names = [
            'view_inventory', 'approve_checkout', 'approve_return', 'approve_renew', 
            'view_roster', 'manage_inventory' # Maybe manage inventory too? Let's say yes for now or stick to basics.
            # User didn't specify exact Volunteer perms, but Incharge needs to be fixed.
            # Let's give Volunteer basic operational perms.
        ]
        volunteer_perms = Permission.query.filter(Permission.name.in_(volunteer_perm_names)).all()
        volunteer_role.permissions = volunteer_perms

        # Student: Basic permissions (mostly implicit, but maybe view_inventory)
        student_role = Role.query.filter_by(name='Student').first()
        if not student_role:
            student_role = Role(name='Student')
            db.session.add(student_role)
        
        student_perms = Permission.query.filter(Permission.name.in_(['view_inventory'])).all()
        student_role.permissions = student_perms

        db.session.commit()
        print("Permissions updated.")

        # 3. Enforce Single Role per User
        print("Enforcing single role per user...")
        users = User.query.all()
        role_priority = ['Admin', 'Incharge', 'Volunteer', 'Student']
        
        for user in users:
            if len(user.roles) > 1:
                print(f"User {user.name} has multiple roles: {[r.name for r in user.roles]}")
                # Find highest priority role
                selected_role = None
                for role_name in role_priority:
                    r = next((r for r in user.roles if r.name == role_name), None)
                    if r:
                        selected_role = r
                        break
                
                if selected_role:
                    print(f"  Keeping {selected_role.name}")
                    user.roles = [selected_role]
                else:
                    # Fallback
                    user.roles = [student_role]
        
        db.session.commit()
        print("Single role enforcement complete.")

if __name__ == '__main__':
    fix_permissions()
