from app import create_app
from extensions import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    inspector = db.inspect(db.engine)
    columns = [c['name'] for c in inspector.get_columns('transactions')]
    
    with db.engine.connect() as conn:
        if 'fine_paid_amount' not in columns:
            print("Adding fine_paid_amount column...")
            conn.execute(text("ALTER TABLE transactions ADD COLUMN fine_paid_amount FLOAT DEFAULT 0.0"))
            conn.commit()
            print("Database schema updated successfully.")
        else:
            print("Column fine_paid_amount already exists.")
