from app import create_app
from extensions import db
from models import Department, User

app = create_app()

def clean_departments():
    with app.app_context():
        # Valid departments mapping (Code -> Full Name)
        valid_depts = {
            'CSE': 'Computer Science and Engineering',
            'ECE': 'Electronics and Communication Engineering',
            'EEE': 'Electrical and Electronics Engineering',
            'CVL': 'Civil Engineering',
            'MCE': 'Mechanical Engineering',
            'ATE': 'Automobile Engineering',
            'CDN': 'Computer Science and Engineering (Data Science)',
            'IMT': 'Information Technology'
        }
        
        # 1. Ensure valid departments exist with correct names
        for code, name in valid_depts.items():
            dept = Department.query.filter_by(name=code).first()
            if not dept:
                print(f"Creating {code}...")
                dept = Department(name=code, description=name)
                db.session.add(dept)
            else:
                if dept.description != name:
                    print(f"Updating description for {code}...")
                    dept.description = name
        
        db.session.commit()
        
        # 2. Identify and remove invalid departments
        all_depts = Department.query.all()
        for dept in all_depts:
            if dept.name not in valid_depts:
                print(f"Found invalid department: {dept.name}")
                # Check if any users are assigned
                user_count = User.query.filter_by(department_id=dept.id).count()
                if user_count > 0:
                    print(f"  WARNING: {dept.name} has {user_count} users. NOT DELETING.")
                    # Optional: Migrate users?
                    # For now, just warn.
                else:
                    print(f"  Deleting {dept.name}...")
                    db.session.delete(dept)
                    
        db.session.commit()
        print("Department cleanup complete.")

if __name__ == "__main__":
    clean_departments()
