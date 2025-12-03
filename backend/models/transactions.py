from extensions import db
from datetime import datetime

class Transaction(db.Model):
    __tablename__ = 'transactions'
    id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(db.String(50), unique=True, nullable=False) # DBL-2025-000001
    inventory_item_id = db.Column(db.Integer, db.ForeignKey('inventory_items.id'), nullable=False)
    borrower_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    requested_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    rejected_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    processed_by_id = db.Column(db.Integer, db.ForeignKey('users.id')) # For returns/renewals
    processed_at = db.Column(db.DateTime)
    
    status = db.Column(db.String(20), default='REQUESTED') 
    # REQUESTED, APPROVED, ISSUED, RETURN_REQUESTED, RETURNED, RENEW_REQUESTED, OVERDUE, CANCELLED
    
    issue_date = db.Column(db.DateTime)
    due_date = db.Column(db.DateTime)
    return_date = db.Column(db.DateTime)
    
    renewal_count = db.Column(db.Integer, default=0)
    max_renewals = db.Column(db.Integer, default=4)
    fine_accrued = db.Column(db.Float, default=0.0)
    notes = db.Column(db.Text)

    item = db.relationship('InventoryItem', backref=db.backref('transactions', lazy=True))
    borrower = db.relationship('User', foreign_keys=[borrower_id], backref='borrowings')
    approver = db.relationship('User', foreign_keys=[approved_by_id], backref='approvals')

class Waitlist(db.Model):
    __tablename__ = 'waitlist'
    id = db.Column(db.Integer, primary_key=True)
    inventory_item_id = db.Column(db.Integer, db.ForeignKey('inventory_items.id'), nullable=False)
    requester_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='QUEUED') # QUEUED, NOTIFIED, FULFILLED, CANCELLED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    item = db.relationship('InventoryItem', backref=db.backref('waitlist', lazy=True))
    requester = db.relationship('User', backref='waitlist_entries')
