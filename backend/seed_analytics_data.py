from app import create_app
from extensions import db
from models import User, InventoryItem, Transaction, Department, Donor, Role
from datetime import datetime, timedelta
import random

app = create_app()

def seed_analytics_data():
    with app.app_context():
        print("Seeding analytics data...")
        
        # Ensure departments exist
        depts = ['CSE', 'ECE', 'MECH', 'CIVIL', 'EEE']
        dept_objs = []
        for d_name in depts:
            dept = Department.query.filter_by(name=d_name).first()
            if not dept:
                dept = Department(name=d_name, description=f"{d_name} Department")
                db.session.add(dept)
            dept_objs.append(dept)
        db.session.commit()
        
        # Ensure donors exist
        donors = []
        for i in range(5):
            donor = Donor(name=f"Donor {i+1}", branch="CSE", batch="2020", email=f"donor{i+1}@example.com")
            db.session.add(donor)
            donors.append(donor)
        db.session.commit()
        
        # Ensure items exist
        items = []
        for i in range(20):
            item = InventoryItem(
                title=f"Book Title {i+1}", 
                type="Book", 
                quantity_total=5, 
                quantity_available=5,
                donor_id=random.choice(donors).id if donors else None
            )
            db.session.add(item)
            items.append(item)
        db.session.commit()
        
        # Ensure users exist
        student_role = Role.query.filter_by(name='Student').first()
        users = []
        for i in range(10):
            user = User.query.filter_by(email=f"student{i+1}@example.com").first()
            if not user:
                user = User(
                    name=f"Student {i+1}", 
                    email=f"student{i+1}@example.com", 
                    roll_number=f"R{i+1}",
                    department_id=random.choice(dept_objs).id if dept_objs else None,
                    status='approved'
                )
                if student_role:
                    user.roles.append(student_role)
                db.session.add(user)
            users.append(user)
        db.session.commit()
        
        # Create transactions
        # 1. Active checkouts (ISSUED)
        for i in range(15):
            user = random.choice(users)
            item = random.choice(items)
            txn = Transaction(
                transaction_id=f"TXN-A-{i}",
                inventory_item_id=item.id,
                borrower_id=user.id,
                status='ISSUED',
                issue_date=datetime.utcnow() - timedelta(days=random.randint(1, 10)),
                due_date=datetime.utcnow() + timedelta(days=random.randint(1, 10))
            )
            db.session.add(txn)
            
        # 2. Overdue items
        for i in range(5):
            user = random.choice(users)
            item = random.choice(items)
            txn = Transaction(
                transaction_id=f"TXN-O-{i}",
                inventory_item_id=item.id,
                borrower_id=user.id,
                status='ISSUED',
                issue_date=datetime.utcnow() - timedelta(days=20),
                due_date=datetime.utcnow() - timedelta(days=5) # Overdue
            )
            db.session.add(txn)
            
        # 3. Returned items (History)
        for i in range(30):
            user = random.choice(users)
            item = random.choice(items)
            txn = Transaction(
                transaction_id=f"TXN-R-{i}",
                inventory_item_id=item.id,
                borrower_id=user.id,
                status='RETURNED',
                issue_date=datetime.utcnow() - timedelta(days=30),
                due_date=datetime.utcnow() - timedelta(days=15),
                return_date=datetime.utcnow() - timedelta(days=16)
            )
            db.session.add(txn)
            
        db.session.commit()
        print("Analytics data seeded successfully.")

if __name__ == '__main__':
    seed_analytics_data()
