from app import create_app, db
from routes.inventory_export import export_master_inventory, export_users, export_donors
import pandas as pd

app = create_app()

with app.app_context():
    print("Testing Master Export...")
    try:
        export_master_inventory()
        print("Master Export Success")
    except Exception as e:
        print(f"Master Export Failed: {e}")
        import traceback
        traceback.print_exc()

    print("\nTesting User Export...")
    try:
        export_users()
        print("User Export Success")
    except Exception as e:
        print(f"User Export Failed: {e}")
        traceback.print_exc()

    print("\nTesting Donor Export...")
    try:
        export_donors()
        print("Donor Export Success")
    except Exception as e:
        print(f"Donor Export Failed: {e}")
        traceback.print_exc()
