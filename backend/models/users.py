from extensions import db
from datetime import datetime

# Association Tables
user_roles = db.Table('user_roles',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('role_id', db.Integer, db.ForeignKey('roles.id'), primary_key=True)
)

role_permissions = db.Table('role_permissions',
    db.Column('role_id', db.Integer, db.ForeignKey('roles.id'), primary_key=True),
    db.Column('permission_id', db.Integer, db.ForeignKey('permissions.id'), primary_key=True)
)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    roll_number = db.Column(db.String(20), unique=True, nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    batch = db.Column(db.String(20))
    phone_number = db.Column(db.String(15))
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    status = db.Column(db.String(20), default='pending_approval') # pending_approval, approved, rejected, blocked
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    approved_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_at = db.Column(db.DateTime)
    rejected_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    rejected_at = db.Column(db.DateTime)
    rejection_reason = db.Column(db.String(255))

    # OTP Support
    reset_otp = db.Column(db.String(6))
    reset_otp_expiry = db.Column(db.DateTime)
    otp_last_sent_at = db.Column(db.DateTime)
    otp_sent_count = db.Column(db.Integer, default=0)


    roles = db.relationship('Role', secondary=user_roles, lazy='subquery',
        backref=db.backref('users', lazy=True))
    
    department = db.relationship('Department', backref='department_users')

    @property
    def role(self):
        if not self.roles:
            return "Student"
        
        role_names = [r.name for r in self.roles]
        if "Admin" in role_names: return "Admin"
        if "Incharge" in role_names: return "Incharge"
        if "Volunteer" in role_names: return "Volunteer"
        
        return role_names[0]

    def get_all_permissions(self):
        perms = set()
        if self.roles:
            for role in self.roles:
                if role and role.permissions:
                    for perm in role.permissions:
                        perms.add(perm.name)
        return list(perms)

class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False) # Admin, Incharge, Volunteer, Student
    
    permissions = db.relationship('Permission', secondary=role_permissions, lazy='subquery',
        backref=db.backref('roles', lazy=True))

class Permission(db.Model):
    __tablename__ = 'permissions'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False) # manage_inventory, approve_checkout, etc.
    description = db.Column(db.String(200))
