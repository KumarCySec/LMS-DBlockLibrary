from app import create_app, db
from models import Role, Permission

app = create_app()

with app.app_context():
    roles = Role.query.all()
    for role in roles:
        perms = [p.name for p in role.permissions]
        print(f"Role: {role.name}")
        print(f"  Permissions: {', '.join(perms)}")
        print("-" * 20)
