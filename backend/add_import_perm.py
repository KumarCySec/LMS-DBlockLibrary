from app import create_app, db
from models import Role, Permission

app = create_app()

with app.app_context():
    # 1. Ensure permission exists
    perm_name = 'import_data'
    perm = Permission.query.filter_by(name=perm_name).first()
    if not perm:
        print(f"Creating permission: {perm_name}")
        perm = Permission(name=perm_name, description='Import data from CSV')
        db.session.add(perm)
        db.session.commit()
    else:
        print(f"Permission {perm_name} already exists")

    # 2. Add to Incharge role
    role_name = 'Incharge'
    role = Role.query.filter_by(name=role_name).first()
    if role:
        if perm not in role.permissions:
            role.permissions.append(perm)
            db.session.commit()
            print(f"Added '{perm_name}' to {role_name}")
        else:
            print(f"'{perm_name}' already in {role_name}")
    else:
        print(f"Role {role_name} not found!")
