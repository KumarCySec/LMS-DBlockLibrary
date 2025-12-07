import shutil
import os
import datetime

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'instance', 'lms.db')
BACKUP_DIR = os.path.join(os.path.dirname(BASE_DIR), 'backups')

def backup_database():
    """Creates a timestamped copy of the database in the backups directory."""
    if not os.path.exists(DB_PATH):
        print(f"Error: Database file not found at {DB_PATH}")
        return

    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
        print(f"Created backup directory at {BACKUP_DIR}")

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"lms_{timestamp}.db.bak"
    backup_path = os.path.join(BACKUP_DIR, backup_filename)

    try:
        shutil.copy2(DB_PATH, backup_path)
        print(f"Use the following command to restore this backup:")
        print(f"Successfully backed up database to: {backup_path}")
    except Exception as e:
        print(f"Failed to backup database: {e}")

if __name__ == "__main__":
    backup_database()
