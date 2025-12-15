
from sqlalchemy import text, inspect
from extensions import db

def check_and_migrate_db(app):
    """
    Checks for missing columns in critical tables and adds them if necessary.
    This is a lightweight auto-migration for production fixes.
    """
    with app.app_context():
        try:
            inspector = inspect(db.engine)
            
            # 1. Transactions: Check for 'created_at'
            if inspector.has_table("transactions"):
                columns = [col['name'] for col in inspector.get_columns("transactions")]
                
                if 'created_at' not in columns:
                    print("Auto-Migrating: Adding created_at to transactions...")
                    with db.engine.connect() as conn:
                        # ALTER TABLE syntax is generally standard for simple column additions
                        conn.execute(text("ALTER TABLE transactions ADD COLUMN created_at DATETIME"))
                        conn.commit()
                    print("Auto-Migrating: Success.")
            
        except Exception as e:
            print(f"Auto-Migration Critical Failure: {e}")

                # 2. Add other checks here if needed in future
                
        except Exception as e:
            print(f"Auto-Migration Critical Failure: {e}")
