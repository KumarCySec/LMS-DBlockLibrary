from app import create_app
from extensions import db
from models import User, Role, Department, InventoryItem, Donor, Transaction, Notification, LibraryStatus, VolunteerSchedule
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import random

app = create_app()

def create_mock_data():
    with app.app_context():
        print("Creating mock data...")
        
        # Ensure roles exist (should be from seed.py, but safe to fetch)
        student_role = Role.query.filter_by(name='Student').first()
        admin_role = Role.query.filter_by(name='Admin').first()
        
        # 1. Departments
        depts = Department.query.all()
        if not depts:
            print("No departments found, please run seed.py first.")
            return

        # 2. Donors
        donors = []
        for i in range(5):
            d = Donor(
                name=f"Alumni Donor {i+1}",
                branch="CSE",
                batch=f"201{i}-201{i+4}",
                email=f"donor{i+1}@example.com"
            )
            db.session.add(d)
            donors.append(d)
        db.session.commit()

        # 3. Inventory Items
        # Books
        book_titles = [
            "Introduction to Algorithms", "Clean Code", "Design Patterns", 
            "The Pragmatic Programmer", "Artificial Intelligence: A Modern Approach",
            "Database System Concepts", "Operating System Concepts", "Computer Networks",
            "Digital Logic Design", "Theory of Computation"
        ]
        
        items = []
        for title in book_titles:
            item = InventoryItem(
                type='Book',
                title=title,
                author="Famous Author",
                quantity_total=3,
                quantity_available=3,
                donor_id=random.choice(donors).id,
                status='active',
                language='English'
            )
            db.session.add(item)
            items.append(item)

        # Laptops
        for i in range(3):
            item = InventoryItem(
                type='Laptop',
                title=f"Dell Latitude {5000+i}",
                model=f"E{5400+i}",
                quantity_total=1,
                quantity_available=1,
                donor_id=random.choice(donors).id,
                status='active',
                specs="i5 8th Gen, 8GB RAM, 256GB SSD"
            )
            db.session.add(item)
            items.append(item)
            
        db.session.commit()

        # 4. Users (Students)
        students = []
        for i in range(5):
            s = User(
                name=f"Student {i+1}",
                roll_number=f"20CS0{i+1}",
                email=f"student{i+1}@dblock.com",
                password_hash=generate_password_hash("password"),
                batch="2022-2026",
                department_id=depts[0].id,
                status='approved' if i < 3 else 'pending_approval' # Mix of approved and pending
            )
            s.roles.append(student_role)
            db.session.add(s)
            students.append(s)
        db.session.commit()

        # 5. Transactions
        # Active checkout
        t1 = Transaction(
            transaction_id="DBL-2025-00001",
            inventory_item_id=items[0].id,
            borrower_id=students[0].id,
            requested_by_id=students[0].id,
            approved_by_id=1, # Admin
            status='ISSUED',
            issue_date=datetime.utcnow() - timedelta(days=5),
            due_date=datetime.utcnow() + timedelta(days=9)
        )
        items[0].quantity_available -= 1
        
        # Overdue checkout
        t2 = Transaction(
            transaction_id="DBL-2025-00002",
            inventory_item_id=items[1].id,
            borrower_id=students[1].id,
            requested_by_id=students[1].id,
            approved_by_id=1,
            status='OVERDUE',
            issue_date=datetime.utcnow() - timedelta(days=20),
            due_date=datetime.utcnow() - timedelta(days=6),
            fine_accrued=60.0
        )
        items[1].quantity_available -= 1

        # Pending Request
        t3 = Transaction(
            transaction_id="DBL-2025-00003",
            inventory_item_id=items[2].id,
            borrower_id=students[2].id,
            requested_by_id=students[2].id,
            status='REQUESTED'
        )

        db.session.add_all([t1, t2, t3])
        db.session.commit()

        # 6. Notifications
        n1 = Notification(
            user_id=students[1].id,
            type='overdue',
            title='Item Overdue',
            body=f'Your book "{items[1].title}" is overdue by 6 days.',
            related_transaction_id=t2.id
        )
        db.session.add(n1)
        db.session.commit()

        print("Mock data created successfully!")

if __name__ == '__main__':
    create_mock_data()
