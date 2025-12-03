from app import create_app
from extensions import db
from models import User, Role
from werkzeug.security import generate_password_hash

app = create_app()

def seed_extra_roles():
    with app.app_context():
        print("Seeding extra roles...")
        
        roles = {
            'Incharge': 'incharge@dblock.com',
            'Volunteer': 'volunteer@dblock.com'
        }
        
        for role_name, email in roles.items():
            user = User.query.filter_by(email=email).first()
            if not user:
                role = Role.query.filter_by(name=role_name).first()
                if not role:
                    print(f"Role {role_name} not found!")
                    continue
                    
                user = User(
                    name=f"Test {role_name}",
                    email=email,
                    password_hash=generate_password_hash("password"),
                    roll_number=f"TEST-{role_name.upper()}",
                    status='approved',
                    department_id=1
                )
                user.roles.append(role)
                db.session.add(user)
                print(f"Created {role_name}: {email}")
            else:
                print(f"{role_name} already exists.")
                
        db.session.commit()

if __name__ == '__main__':
    seed_extra_roles()
