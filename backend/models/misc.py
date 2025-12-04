from extensions import db
from datetime import datetime

class LibraryStatus(db.Model):
    __tablename__ = 'library_status'
    id = db.Column(db.Integer, primary_key=True)
    is_open = db.Column(db.Boolean, default=False)
    message = db.Column(db.String(255))
    next_estimated_open_time = db.Column(db.DateTime)
    last_updated_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class VolunteerSchedule(db.Model):
    __tablename__ = 'volunteer_schedule'
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    volunteer_1_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    volunteer_2_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AppSetting(db.Model):
    __tablename__ = 'app_settings'
    key = db.Column(db.String(50), primary_key=True)
    value = db.Column(db.String(255)) # Store as string, cast when needed
    type = db.Column(db.String(20)) # int, float, string, boolean, json
    updated_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(50)) # due_soon, overdue, approval, system
    title = db.Column(db.String(100))
    body = db.Column(db.Text)
    related_transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id'), nullable=True)
    read_flag = db.Column(db.Boolean, default=False)
    archived = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AttendanceLog(db.Model):
    __tablename__ = 'attendance_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow().date)
    check_in_time = db.Column(db.DateTime, nullable=False)
    check_out_time = db.Column(db.DateTime)
    duration_minutes = db.Column(db.Integer)
    status = db.Column(db.String(20), default='ACTIVE') # ACTIVE, COMPLETED
    
    user = db.relationship('User', backref='attendance_logs')
