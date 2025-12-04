from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    # Check if columns exist, if not add them
    # SQLite syntax
    try:
        with db.engine.connect() as conn:
            conn.execute(text("ALTER TABLE inventory_copies ADD COLUMN date_of_entry DATE"))
            print("Added date_of_entry column")
    except Exception as e:
        print(f"date_of_entry might already exist: {e}")

    try:
        with db.engine.connect() as conn:
            conn.execute(text("ALTER TABLE inventory_copies ADD COLUMN date_received DATE"))
            print("Added date_received column")
    except Exception as e:
        print(f"date_received might already exist: {e}")
        
    print("Schema update complete.")
