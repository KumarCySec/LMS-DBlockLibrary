
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
                        conn.execute(text("ALTER TABLE transactions ADD COLUMN created_at DATETIME"))
                        conn.commit()
                    print("Auto-Migrating: Success (transactions).")

            # 2. Attendance Logs: Check for approval columns
            if inspector.has_table("attendance_logs"):
                columns = [col['name'] for col in inspector.get_columns("attendance_logs")]
                
                with db.engine.connect() as conn:
                    if 'approved_by_id' not in columns:
                        print("Auto-Migrating: Adding approved_by_id to attendance_logs...")
                        conn.execute(text("ALTER TABLE attendance_logs ADD COLUMN approved_by_id INTEGER REFERENCES users(id)"))
                        conn.commit()
                    
                    if 'approved_at' not in columns:
                        print("Auto-Migrating: Adding approved_at to attendance_logs...")
                        conn.execute(text("ALTER TABLE attendance_logs ADD COLUMN approved_at DATETIME"))
                        conn.commit()

                    if 'rejection_reason' not in columns:
                        print("Auto-Migrating: Adding rejection_reason to attendance_logs...")
                        conn.execute(text("ALTER TABLE attendance_logs ADD COLUMN rejection_reason TEXT"))
                        conn.commit()
                    print("Auto-Migrating: Success (attendance_logs).")
            
        except Exception as e:
            print(f"Auto-Migration Critical Failure: {e}")

                # 2. Add other checks here if needed in future
                
        except Exception as e:
            print(f"Auto-Migration Critical Failure: {e}")
