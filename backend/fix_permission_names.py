from app import create_app
from extensions import db
from models import Permission, Role

app = create_app()

with app.app_context():
    print("Standardizing 'approve_renew' permission...")
    
    # Target permission
    target_name = 'approve_renew'
    target_perm = Permission.query.filter_by(name=target_name).first()
    
    if not target_perm:
        target_perm = Permission(name=target_name, description="Approve renewal requests")
        db.session.add(target_perm)
        print(f"Created permission: {target_name}")
    else:
        print(f"Permission {target_name} already exists.")
        
    # Old permissions to migrate from
    old_names = ['approve_renewal', 'approve_renew_request']
    
    for old_name in old_names:
        old_perm = Permission.query.filter_by(name=old_name).first()
        if old_perm:
            print(f"Found old permission: {old_name}")
            # Find roles with this permission
            roles = Role.query.all()
            for role in roles:
                if old_perm in role.permissions:
                    print(f" - Role '{role.name}' had '{old_name}'")
                    if target_perm not in role.permissions:
                        role.permissions.append(target_perm)
                        print(f"   -> Added '{target_name}' to '{role.name}'")
                    role.permissions.remove(old_perm)
            
            # Delete old permission
            db.session.delete(old_perm)
            print(f"Deleted old permission: {old_name}")
            
    # Explicitly ensure Incharge and Admin have it
    for role_name in ['Incharge', 'Admin']:
        role = Role.query.filter_by(name=role_name).first()
        if role:
            if target_perm not in role.permissions:
                role.permissions.append(target_perm)
                print(f"Explicitly added '{target_name}' to '{role_name}'")
    
    db.session.commit()
    print("Permissions standardized successfully.")
