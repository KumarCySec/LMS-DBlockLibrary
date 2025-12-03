from app import create_app
from extensions import db
from models import User, Role, Permission, Department, AppSetting
from werkzeug.security import generate_password_hash

app = create_app()

def seed_data():
    with app.app_context():
        print("Seeding data...")
        
        # 1. Roles
        roles = ['Admin', 'Incharge', 'Volunteer', 'Student']
        role_objects = {}
        for r_name in roles:
            role = Role.query.filter_by(name=r_name).first()
            if not role:
                role = Role(name=r_name)
                db.session.add(role)
            role_objects[r_name] = role
        
        # 2. Permissions
        permissions = [
            'manage_inventory', 'approve_checkout', 'approve_return', 'approve_renew',
            'manage_settings', 'manage_users', 'view_analytics', 'update_library_status'
        ]
        perm_objects = {}
        for p_name in permissions:
            perm = Permission.query.filter_by(name=p_name).first()
            if not perm:
                perm = Permission(name=p_name, description=f"Permission to {p_name.replace('_', ' ')}")
                db.session.add(perm)
            perm_objects[p_name] = perm
        
        db.session.commit()

        # 3. Role Permissions (Default mappings)
        # Admin gets all
        role_objects['Admin'].permissions = list(perm_objects.values())
        
        # Incharge
        incharge_perms = ['manage_inventory', 'approve_checkout', 'approve_return', 'approve_renew', 'view_analytics', 'update_library_status']
        role_objects['Incharge'].permissions = [perm_objects[p] for p in incharge_perms]
        
        # Volunteer
        volunteer_perms = ['approve_checkout', 'approve_return', 'approve_renew', 'update_library_status']
        role_objects['Volunteer'].permissions = [perm_objects[p] for p in volunteer_perms]
        
        # Student gets none by default (read-only access handled by logic)

        # 4. Departments
        departments = ['CS-DS', 'CSE', 'ECE', 'EEE', 'CIVIL', 'AUTO', 'MECH', 'IT']
        for d_name in departments:
            dept = Department.query.filter_by(name=d_name).first()
            if not dept:
                dept = Department(name=d_name)
                db.session.add(dept)
        
        # 5. Settings
        settings = {
            'fine_per_day': ('10', 'float'),
            'max_renewals': ('4', 'int'),
            'default_due_days': ('14', 'int'),
            'volunteers_per_day': ('2', 'int')
        }
        for key, (val, type_) in settings.items():
            setting = AppSetting.query.get(key)
            if not setting:
                setting = AppSetting(key=key, value=val, type=type_)
                db.session.add(setting)

        # 6. Admin User
        admin = User.query.filter_by(email='admin@dblock.com').first()
        if not admin:
            admin = User(
                name='Super Admin',
                roll_number='ADMIN001',
                email='admin@dblock.com',
                password_hash=generate_password_hash('admin123'),
                status='approved',
                phone_number='9999999999',
                batch='2020-2024'
            )
            admin.roles.append(role_objects['Admin'])
            db.session.add(admin)

        db.session.commit()
        print("Seeding complete!")

if __name__ == '__main__':
    seed_data()
