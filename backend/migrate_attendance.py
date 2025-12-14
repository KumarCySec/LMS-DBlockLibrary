from app import app, db
from sqlalchemy import text

def run_migration():
    with app.app_context():
        print("Starting Migration: Add Approval Columns to Attendance Logs")
        
        # Check if column exists first to avoid errors
        inspector = db.inspect(db.engine)
        columns = [c['name'] for c in inspector.get_columns('attendance_logs')]
        
        try:
            if 'approved_by_id' not in columns:
                print("Adding approved_by_id...")
                db.session.execute(text("ALTER TABLE attendance_logs ADD COLUMN approved_by_id INTEGER REFERENCES users(id)"))
            
            if 'approved_at' not in columns:
                print("Adding approved_at...")
                db.session.execute(text("ALTER TABLE attendance_logs ADD COLUMN approved_at DATETIME"))
                
            if 'rejection_reason' not in columns:
                print("Adding rejection_reason...")
                db.session.execute(text("ALTER TABLE attendance_logs ADD COLUMN rejection_reason TEXT"))

            if 'status' not in columns:
                 print("Adding status column...")
                 # Verify status column exists (it likely does based on previous code view, but 'PENDING_APPROVAL' is a value change, not schema change usually)
                 db.session.execute(text("ALTER TABLE attendance_logs ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE'"))
            
            db.session.commit()
            print("Migration successful!")
            
        except Exception as e:
            print(f"Migration Failed: {e}")
            db.session.rollback()

if __name__ == "__main__":
    run_migration()
