from app import create_app
from extensions import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    # Check if columns exist
    inspector = db.inspect(db.engine)
    columns = [c['name'] for c in inspector.get_columns('transactions')]
    
    with db.engine.connect() as conn:
        if 'rent_amount' not in columns:
            print("Adding rent_amount column...")
            conn.execute(text("ALTER TABLE transactions ADD COLUMN rent_amount FLOAT DEFAULT 0.0"))
            
        if 'payment_status' not in columns:
            print("Adding payment_status column...")
            conn.execute(text("ALTER TABLE transactions ADD COLUMN payment_status VARCHAR(20) DEFAULT 'PENDING'"))
            
        if 'payment_method' not in columns:
            print("Adding payment_method column...")
            conn.execute(text("ALTER TABLE transactions ADD COLUMN payment_method VARCHAR(50)"))
            
        conn.commit()
        print("Database schema updated successfully.")
