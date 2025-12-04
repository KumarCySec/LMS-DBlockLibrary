from app import create_app, db
from models import User
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    admin = User.query.filter_by(email='admin@gce.edu').first()
    if not admin:
        # Try finding by role
        from models import Role
        admin_role = Role.query.filter_by(name='Admin').first()
        if admin_role:
            admin = User.query.filter(User.roles.contains(admin_role)).first()
    
    if admin:
        print(f"Resetting password for {admin.email}...")
        admin.password_hash = generate_password_hash('admin123')
        db.session.commit()
        print("Password reset to 'admin123'")
    else:
        print("Admin user not found.")
