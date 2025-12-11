from app import app
from extensions import db
from models import User, Department

# Migration Map: Old Code -> New Code
MIGRATION_MAP = {
    'CIVIL': 'CVL',
    'AUTO': 'ATE',
    'MECH': 'MCE',
    'IT': 'IMT',
    'CS-DS': 'CDS',
    'DS': 'CDS',
    'AIML': 'CSE', # Assuming map to CSE or specific if exists
    'Unknown': None
}

def cleanup():
    with app.app_context():
        print("Starting Department Cleanup...")
        
        # 1. Migrate Users
        for old_code, new_code in MIGRATION_MAP.items():
            old_dept = Department.query.filter_by(name=old_code).first()
            if not old_dept:
                continue
                
            print(f"Processing old department: {old_code}")
            
            if new_code:
                new_dept = Department.query.filter_by(name=new_code).first()
                if not new_dept:
                    # Create if only description known? Should exist from seed.
                    # Providing fallback just in case
                    print(f"  Target department {new_code} not found! Skipping migration for {old_code}")
                    continue
                
                # Move users
                users = User.query.filter_by(department_id=old_dept.id).all()
                if users:
                    print(f"  Migrating {len(users)} users from {old_code} to {new_code}...")
                    for u in users:
                        u.department_id = new_dept.id
                    db.session.commit()
            
            # 2. Delete Old Department (only if empty)
            user_count = User.query.filter_by(department_id=old_dept.id).count()
            if user_count == 0:
                print(f"  Deleting empty department: {old_code}")
                db.session.delete(old_dept)
                db.session.commit()
            else:
                print(f"  WARNING: Could not delete {old_code}, still has {user_count} users.")

        print("Cleanup Complete!")

if __name__ == "__main__":
    cleanup()
