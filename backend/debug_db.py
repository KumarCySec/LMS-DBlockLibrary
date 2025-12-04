from app import create_app
from extensions import db
from models import InventoryItem, Donor, InventoryCopy

app = create_app()

with app.app_context():
    print("--- Checking Donor ID 1 ---")
    donor = Donor.query.get(1)
    if donor:
        print(f"Found: {donor.name} (ID: {donor.id})")
    else:
        print("Donor ID 1 NOT FOUND")

    print("\n--- Checking Item with Acc No 1 ---")
    copy = InventoryCopy.query.filter_by(acc_no='1').first()
    if copy:
        print(f"Copy Acc 1 Found. Date Received: {copy.date_received}")
        item = copy.item
        print(f"Linked Item ID: {item.id}, Title: {item.title}, Date Donation: {item.date_of_donation}")
        if item.donor:
            print(f"Linked Donor: {item.donor.name} (ID: {item.donor.id})")
        else:
            print("No Linked Donor")
    else:
        print("Copy Acc 1 NOT FOUND")
