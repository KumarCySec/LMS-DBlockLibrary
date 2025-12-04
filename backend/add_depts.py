from app import create_app
from extensions import db
from models import Department

app = create_app()

def add_departments():
    with app.app_context():
        # List of all expected departments
        depts = [
            'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'IBT', 'MCT', 'AIDS', 'CSBS',
            'CDN', 'CDS', 'MCE', 'ATE', 'IMT'
        ]
        
        added_count = 0
        for name in depts:
            existing = Department.query.filter_by(name=name).first()
            if not existing:
                print(f"Adding missing department: {name}")
                new_dept = Department(name=name, description=f"Department of {name}")
                db.session.add(new_dept)
                added_count += 1
            else:
                print(f"Department {name} already exists.")
                
        if added_count > 0:
            db.session.commit()
            print(f"Successfully added {added_count} departments.")
        else:
            print("All departments already exist.")

if __name__ == "__main__":
    add_departments()
