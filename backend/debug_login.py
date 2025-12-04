from app import create_app, db
from models import User
from werkzeug.security import check_password_hash

app = create_app()

with app.app_context():
    email = input("Enter email to check: ")
    user = User.query.filter_by(email=email).first()
    
    if not user:
        print(f"User with email {email} not found.")
    else:
        print(f"User found: {user.name} (Role: {user.role})")
        password = input("Enter password to verify: ")
        if user.check_password(password):
            print("Password match: YES")
        else:
            print("Password match: NO")
            print(f"Stored Hash: {user.password_hash}")
            
            # Optional: Reset password
            reset = input("Reset password to 'password123'? (y/n): ")
            if reset.lower() == 'y':
                user.set_password('password123')
                db.session.commit()
                print("Password reset to 'password123'")
