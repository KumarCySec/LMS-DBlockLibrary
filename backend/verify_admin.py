from app import create_app
from models import User
from werkzeug.security import check_password_hash

app = create_app()

with app.app_context():
    u = User.query.filter_by(email='admin@gce.edu').first()
    if u:
        print(f"User: {u.email}, Role: {u.role}")
        print(f"Hash: {u.password_hash}")
        is_valid = check_password_hash(u.password_hash, 'admin123')
        print(f"Password 'admin123' valid? {is_valid}")
    else:
        print("User admin@gce.edu not found")
