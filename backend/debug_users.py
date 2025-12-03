from app import create_app
from models import User

app = create_app()

with app.app_context():
    users = User.query.all()
    print(f"{'ID':<5} {'Name':<20} {'Email':<30} {'Status':<15} {'Roles'}")
    print("-" * 80)
    for u in users:
        roles = ", ".join([r.name for r in u.roles])
        print(f"{u.id:<5} {u.name:<20} {u.email:<30} {u.status:<15} {roles}")
