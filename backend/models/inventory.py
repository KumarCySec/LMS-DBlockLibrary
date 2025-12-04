from extensions import db
from datetime import datetime

class Department(db.Model):
    __tablename__ = 'departments'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False) # CS-DS, CSE, ECE, etc.
    description = db.Column(db.String(200))
    is_active = db.Column(db.Boolean, default=True)

class Donor(db.Model):
    __tablename__ = 'donors'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    branch = db.Column(db.String(50), nullable=True)
    batch = db.Column(db.String(20), nullable=True)
    address = db.Column(db.Text)
    mobile_number = db.Column(db.String(15))
    email = db.Column(db.String(120))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class InventoryItem(db.Model):
    __tablename__ = 'inventory_items'
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(20), nullable=False) # Book, Laptop, Kit
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    quantity_total = db.Column(db.Integer, default=1)
    quantity_available = db.Column(db.Integer, default=1)
    date_of_donation = db.Column(db.Date)
    donor_id = db.Column(db.Integer, db.ForeignKey('donors.id'))
    status = db.Column(db.String(20), default='active') # active, retired, lost, damaged
    
    # Book specific
    author = db.Column(db.String(100))
    published_date = db.Column(db.Date)
    language = db.Column(db.String(50))
    
    # Laptop/Kit specific
    model = db.Column(db.String(100))
    serial_number = db.Column(db.String(100))
    specs = db.Column(db.Text)

    donor = db.relationship('Donor', backref=db.backref('donations', lazy=True))
    copies = db.relationship('InventoryCopy', backref='item', lazy=True)

class InventoryCopy(db.Model):
    __tablename__ = 'inventory_copies'
    id = db.Column(db.Integer, primary_key=True)
    inventory_item_id = db.Column(db.Integer, db.ForeignKey('inventory_items.id'), nullable=False)
    acc_no = db.Column(db.String(50), nullable=False) # Unique per item or globally unique? Usually globally unique in libraries.
    status = db.Column(db.String(20), default='AVAILABLE') # AVAILABLE, ISSUED, LOST, DAMAGED, MAINTENANCE
    
    # Optional: Track current holder directly here for easier queries, though Transaction has it.
    current_holder_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Track donor per copy
    donor_id = db.Column(db.Integer, db.ForeignKey('donors.id'), nullable=True)
    donor = db.relationship('Donor', backref=db.backref('donated_copies', lazy=True))
    
    # Ensure acc_no is unique per item or globally. Let's assume globally unique for simplicity in scanning.
    # If not globally unique, we need a composite unique constraint.
    __table_args__ = (db.UniqueConstraint('acc_no', name='unique_acc_no'),)
    
    date_of_entry = db.Column(db.Date)
    date_received = db.Column(db.Date)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
