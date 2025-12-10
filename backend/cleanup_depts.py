from app import create_app
from extensions import db
from models import User, Department
import re

DEPT_MAP = {
    'ECE': 'Electronics and Communication Engineering',
    'EEE': 'Electricals and Electronics Engineering',
    'IMT': 'Information Technology',
    'MCE': 'Mechanical Engineering',
    'CVL': 'Civil Engineering',
    'CSE': 'Computer Science and Engineering',
    'CDS': 'Computer Science and Engineering (Data Science)',
    'ATE': 'Automobile Engineering',
    'MEC': 'M.E. Computer Science and Engineering',
    'MES': 'M.E. Structural Engineering'
}

def auto_heal_user(user, dept_cache=None):
    if dept_cache is None: dept_cache = {}
    changed = False
    
    if user.roll_number:
        roll_clean = user.roll_number.strip().upper()
        # HEURISTIC: If user is in an "OLD" dept (e.g. IT), but roll says IMT, this will move them.
        
        match = re.search(r'^(\d+)([A-Z]+)\d+$', roll_clean)
        if match:
            batch_prefix = match.group(1) 
            dept_code = match.group(2) # e.g. IMT or IT

            # If the extracted code is valid in our NEW MAP, enforce it.
            # Even if they already have a department, if it doesn't match the new code, update it.
            if dept_code in DEPT_MAP:
                # Ensure Department Exists
                dept = dept_cache.get(dept_code)
                if not dept:
                    dept = Department.query.filter_by(name=dept_code).first()
                
                if not dept:
                    print(f"Creating missing department: {dept_code}")
                    dept = Department(name=dept_code, description=DEPT_MAP[dept_code])
                    db.session.add(dept)
                    db.session.flush()
                    dept_cache[dept_code] = dept
                
                if user.department_id != dept.id:
                    print(f"Moving user {user.name} ({user.roll_number}) from DeptID {user.department_id} to {dept.name}")
                    user.department_id = dept.id
                    changed = True

    return changed

def cleanup():
    app = create_app()
    with app.app_context():
        print("Starting cleanup...")
        users = User.query.all()
        dept_cache = {}
        
        # 1. Migrate Users
        print(f"Checking {len(users)} users...")
        for u in users:
            auto_heal_user(u, dept_cache)
        
        db.session.commit()
        print("User migration committed.")

        # 2. Delete Invalid Departments
        all_depts = Department.query.all()
        valid_names = set(DEPT_MAP.keys())
        
        processed_depts = 0
        deleted_count = 0
        
        for d in all_depts:
            if d.name not in valid_names:
                # Check if empty
                user_count = len(d.department_users)
                if user_count == 0:
                    print(f"Deleting empty invalid department: {d.name}")
                    db.session.delete(d)
                    deleted_count += 1
                else:
                    print(f"WARNING: Invalid Department '{d.name}' has {user_count} users. Cannot delete safely.")
                    # Optional: Force move them to a "General" or log them?
                    # For now just print.
        
        if deleted_count > 0:
            db.session.commit()
            print(f"Deleted {deleted_count} invalid departments.")
        else:
            print("No empty invalid departments found.")

if __name__ == '__main__':
    cleanup()
