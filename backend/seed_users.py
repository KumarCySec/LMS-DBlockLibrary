from app import create_app
from extensions import db
from models import User, Role, Department
from werkzeug.security import generate_password_hash

app = create_app()

def seed_users():
    with app.app_context():
        print("Seeding users...")
        
        # Drop all tables to reset schema and data
        db.drop_all()
        # Create tables with new schema
        db.create_all()
        print("Recreated all tables.")
        
        # Clear existing data (not needed anymore since we dropped, but keep structure if needed later)
        # try:
        #     # Delete all rows from user_roles association table first
        #     db.session.execute(db.text('DELETE FROM user_roles'))
        #     
        #     # Delete all users
        #     db.session.execute(db.text('DELETE FROM users'))
        #     
        #     db.session.commit()
        #     print("Cleared existing users and roles.")
        # except Exception as e:
        #     print(f"Error clearing data: {e}")
        #     db.session.rollback()
        #     return
        try:
            # Delete all rows from user_roles association table first
            db.session.execute(db.text('DELETE FROM user_roles'))
            
            # Delete all users
            db.session.execute(db.text('DELETE FROM users'))
            
            db.session.commit()
            print("Cleared existing users and roles.")
        except Exception as e:
            print(f"Error clearing data: {e}")
            db.session.rollback()
            return

        # Ensure Department exists
        dept = Department.query.filter_by(name='CSE').first()
        if not dept:
            dept = Department(name='CSE', description='Computer Science')
            db.session.add(dept)
            db.session.commit()
            print("Created Department: CSE")
        
        # Ensure Roles exist
        roles = ['Admin', 'Incharge', 'Volunteer', 'Student']
        role_objects = {}
        for role_name in roles:
            role = Role.query.filter_by(name=role_name).first()
            if not role:
                role = Role(name=role_name)
                db.session.add(role)
            role_objects[role_name] = role
        db.session.commit()

        # Create Users
        try:
            users_data = []
            
            for role_name in roles:
                for i in range(1, 5):
                    username = f"{role_name.lower()}{i}"
                    email = f"{username}@dblock.lib"
                    password = "password123"
                    
                    # Check if exists (paranoid check)
                    if User.query.filter_by(email=email).first():
                        print(f"Skipping {email}, already exists.")
                        continue

                    user = User(
                        name=f"{role_name} User {i}",
                        roll_number=f"{role_name[:3].upper()}{i:03d}", # ADM001, INC001, ...
                        email=email,
                        password_hash=generate_password_hash(password),
                        department_id=dept.id,
                        batch='2024',
                        status='approved',
                        phone_number='1234567890'
                    )
                    
                    user.roles.append(role_objects[role_name])
                    db.session.add(user)
                    users_data.append((role_name, email, password))
            
            db.session.commit()
            print("Successfully created 16 users.")
            
            print("\n--- Credentials ---")
            print("| Role | Email | Password |")
            print("|---|---|---|")
            for role, email, pwd in users_data:
                print(f"| {role} | {email} | {pwd} |")
                
        except Exception as e:
            print(f"Error creating users: {e}")
            import traceback
            traceback.print_exc()
            db.session.rollback()

if __name__ == '__main__':
    seed_users()
