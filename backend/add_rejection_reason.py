from app import create_app
from extensions import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        with db.engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN rejection_reason VARCHAR(255)"))
            conn.commit()
        print("Column added successfully")
    except Exception as e:
        print(f"Error (might already exist): {e}")
