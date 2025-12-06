from app import create_app, db
from sqlalchemy import text

app = create_app()

def add_otp_columns():
    with app.app_context():
        try:
            # Check if columns exist
            with db.engine.connect() as conn:
                result = conn.execute(text("PRAGMA table_info(users)"))
                columns = [row[1] for row in result]
                
                if 'reset_otp' not in columns:
                    print("Adding reset_otp column...")
                    conn.execute(text("ALTER TABLE users ADD COLUMN reset_otp VARCHAR(6)"))
                else:
                    print("reset_otp column already exists.")

                if 'reset_otp_expiry' not in columns:
                    print("Adding reset_otp_expiry column...")
                    conn.execute(text("ALTER TABLE users ADD COLUMN reset_otp_expiry DATETIME"))
                else:
                    print("reset_otp_expiry column already exists.")
                
                if 'otp_last_sent_at' not in columns:
                    print("Adding otp_last_sent_at column...")
                    conn.execute(text("ALTER TABLE users ADD COLUMN otp_last_sent_at DATETIME"))
                else:
                     print("otp_last_sent_at column already exists.")

                if 'otp_sent_count' not in columns:
                    print("Adding otp_sent_count column...")
                    conn.execute(text("ALTER TABLE users ADD COLUMN otp_sent_count INTEGER DEFAULT 0"))
                else:
                    print("otp_sent_count column already exists.")

                conn.commit()
                print("Database migration completed successfully.")
        except Exception as e:
            print(f"An error occurred: {e}")

if __name__ == "__main__":
    add_otp_columns()
