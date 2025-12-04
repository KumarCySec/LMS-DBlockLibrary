from app import create_app, db
from models import User, Role
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    # Find role Admin
    admin_role = Role.query.filter_by(name='Admin').first()
    if not admin_role:
        print("Role 'Admin' not found!")
    else:
        # Find user with this role
        admin_user = User.query.filter(User.roles.contains(admin_role)).first()
        if admin_user:
            print(f"FOUND ADMIN USER: {admin_user.email}")
            print(f"Resetting password to 'admin123'...")
            admin_user.password_hash = generate_password_hash('admin123')
            db.session.commit()
            print("SUCCESS: Password reset.")
        else:
            print("No user with 'Admin' role found.")
