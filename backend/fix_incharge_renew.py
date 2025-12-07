from app import create_app, db
from models import Role, Permission, role_permissions

app = create_app()

def fix_permissions():
    with app.app_context():
        # Get Incharge Role
        incharge_role = Role.query.filter_by(name='Incharge').first()
        if not incharge_role:
            print("Incharge role not found!")
            return

        # Get Permission
        perm_name = 'approve_renew_request'
        perm = Permission.query.filter_by(name=perm_name).first()
        
        if not perm:
            print(f"Permission '{perm_name}' not found. Creating it...")
            perm = Permission(name=perm_name, description='Can approve renewal requests')
            db.session.add(perm)
            db.session.commit()
            
        # Check association
        if perm not in incharge_role.permissions:
            print(f"Adding '{perm_name}' to Incharge...")
            incharge_role.permissions.append(perm)
            db.session.commit()
            print("Permission added!")
        else:
            print(f"Incharge already has '{perm_name}'.")

        # Also ensure Admin has it
        admin_role = Role.query.filter_by(name='Admin').first()
        if admin_role and perm not in admin_role.permissions:
            print(f"Adding '{perm_name}' to Admin...")
            admin_role.permissions.append(perm)
            db.session.commit()

if __name__ == "__main__":
    fix_permissions()
