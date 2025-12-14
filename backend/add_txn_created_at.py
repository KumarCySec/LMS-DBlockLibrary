
from app import create_app, db
from sqlalchemy import text

app = create_app()

def migrate():
    with app.app_context():
        try:
            # Check if column exists
            with db.engine.connect() as conn:
                result = conn.execute(text("PRAGMA table_info(transactions)"))
                columns = [row[1] for row in result.fetchall()]
                
                if 'created_at' not in columns:
                    print("Adding created_at column to transactions table...")
                    conn.execute(text("ALTER TABLE transactions ADD COLUMN created_at DATETIME"))
                    # Backfill with issue_date or valid current time approximation if needed
                    # For now leave NULL or update manually if critical.
                    # Since we use it for display, we can handle None in frontend/backend (which I already did).
                    conn.commit()
                    print("Migration successful: created_at added.")
                else:
                    print("Column created_at already exists.")
                    
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
