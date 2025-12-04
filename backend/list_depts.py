from app import create_app
from extensions import db
from models import Department

app = create_app()
with app.app_context():
    depts = Department.query.all()
    print("DEPARTMENTS:", [d.name for d in depts])
