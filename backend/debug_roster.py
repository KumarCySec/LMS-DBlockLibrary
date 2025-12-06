from app import create_app
from extensions import db
from models.misc import VolunteerSchedule, AttendanceLog
from models.users import User
from datetime import datetime, timedelta

app = create_app()

def debug_roster():
    with app.app_context():
        # IST Fix
        utc_now = datetime.utcnow()
        ist_now = utc_now + timedelta(hours=5, minutes=30)
        today = ist_now.date()
        
        print(f"Server UTC Time: {utc_now}")
        print(f"Calculated IST Time: {ist_now}")
        print(f"Checking Roster for Date: {today}")
        
        schedules = VolunteerSchedule.query.filter_by(date=today).all()
        
        if not schedules:
            print("NO SCHEDULE FOUND FOR TODAY.")
            # Check surrounding dates
            print("Checking surrounding dates:")
            all_schedules = VolunteerSchedule.query.order_by(VolunteerSchedule.date).all()
            for s in all_schedules:
                print(f" - {s.date}: Dept {s.department_id}, V1: {s.volunteer_1_id}, V2: {s.volunteer_2_id}")
        else:
            print(f"Found {len(schedules)} schedules for today:")
            for s in schedules:
                v1 = User.query.get(s.volunteer_1_id)
                v2 = User.query.get(s.volunteer_2_id) if s.volunteer_2_id else None
                print(f" - ID: {s.id}, Dept: {s.department_id}")
                print(f"   - Volunteer 1: {v1.name} (ID: {v1.id})")
                if v2:
                    print(f"   - Volunteer 2: {v2.name} (ID: {v2.id})")
                    
        # Check Attendance Logs
        print("\nAttendance Logs for Today:")
        logs = AttendanceLog.query.filter_by(date=today).all()
        for l in logs:
            u = User.query.get(l.user_id)
            print(f" - {u.name} (ID: {u.id}): {l.status} (In: {l.check_in_time})")

if __name__ == "__main__":
    debug_roster()
