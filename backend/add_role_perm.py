from app import create_app, db
from models import Role, Permission

app = create_app()

with app.app_context():
    incharge = Role.query.filter_by(name='Incharge').first()
    if not incharge:
        print("Incharge role not found")
        exit()
        
    perm_name = 'manage_roles_permissions'
    perm = Permission.query.filter_by(name=perm_name).first()
    
    if not perm:
        print(f"Permission {perm_name} not found, creating it.")
        perm = Permission(name=perm_name, description="Manage roles and permissions")
        db.session.add(perm)
        
    if perm not in incharge.permissions:
        incharge.permissions.append(perm)
        print(f"Added {perm_name} to Incharge")
    else:
        print(f"Incharge already has {perm_name}")
        
    db.session.commit()
