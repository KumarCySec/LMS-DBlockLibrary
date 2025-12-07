from app import create_app
from extensions import db
from models import Permission

app = create_app()

with app.app_context():
    perms = Permission.query.all()
    print("Current Permissions:")
    for p in perms:
        print(f" - {p.name}")
