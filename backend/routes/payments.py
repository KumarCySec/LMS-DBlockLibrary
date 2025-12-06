from flask import Blueprint, request, jsonify
from extensions import db
from models import Transaction, User
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.decorators import role_required, permission_required
from datetime import datetime

payments_bp = Blueprint('payments', __name__)

@payments_bp.route('/my', methods=['GET'])
@jwt_required()
def get_my_dues():
    current_user_id = get_jwt_identity()
    # Fetch transactions with outstanding rent or fine
    # Outstanding means: (rent > 0 OR fine > 0) AND status != 'PAID'
    txs = Transaction.query.filter(
        Transaction.borrower_id == current_user_id,
        (Transaction.rent_amount > 0) | (Transaction.fine_accrued > 0),
        Transaction.payment_status != 'PAID'
    ).order_by(Transaction.return_date.desc()).all()
    
    result = []
    for tx in txs:
        result.append({
            "id": tx.id,
            "transaction_id": tx.transaction_id,
            "item_title": tx.item.title if tx.item else "Unknown",
            "return_date": tx.return_date.isoformat() if tx.return_date else None,
            "rent_amount": tx.rent_amount,
            "fine_amount": tx.fine_accrued,
            "total_due": (tx.rent_amount or 0) + (tx.fine_accrued or 0),
            "payment_status": tx.payment_status,
            "type": "Rent" if tx.rent_amount > 0 else "Fine"
        })
        
    return jsonify(result), 200

@payments_bp.route('/request', methods=['POST'])
@jwt_required()
def request_payment():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    tx_ids = data.get('transaction_ids', [])
    
    if not tx_ids:
        return jsonify({"error": "No transactions selected"}), 400
        
    updated_count = 0
    for tx_id in tx_ids:
        tx = Transaction.query.get(tx_id)
        if tx and tx.borrower_id == int(current_user_id) and tx.payment_status == 'PENDING':
             tx.payment_status = 'REQUESTED'
             updated_count += 1
             
    db.session.commit()
    return jsonify({"message": f"Payment verification requested for {updated_count} items"}), 200

@payments_bp.route('/pending', methods=['GET'])
@jwt_required()
@role_required(['Admin', 'Incharge', 'Volunteer'])
def get_pending_payments():
    # Fetch all transactions with payment_status = REQUESTED
    # Also include PENDING ones for proactive collection? 
    # Requirement says "admin... will be seeing total collectable... give option to approve payment"
    # So show REQUESTED primarily, maybe filtered view for PENDING.
    
    status_filter = request.args.get('status', 'REQUESTED')
    
    query = Transaction.query.filter(Transaction.payment_status == status_filter)
    
    # Optional: Filter by user roll number search
    search = request.args.get('search')
    if search:
        query = query.join(User, Transaction.borrower_id == User.id).filter(
            (User.name.ilike(f"%{search}%")) | (User.roll_number.ilike(f"%{search}%"))
        )
        
    txs = query.order_by(Transaction.return_date.desc()).all()
    
    result = []
    for tx in txs:
        result.append({
            "id": tx.id,
            "transaction_id": tx.transaction_id,
            "borrower_name": tx.borrower.name,
            "borrower_roll": tx.borrower.roll_number,
            "item_title": tx.item.title,
            "rent_amount": tx.rent_amount,
            "fine_amount": tx.fine_accrued,
            "total_amount": (tx.rent_amount or 0) + (tx.fine_accrued or 0),
            "payment_status": tx.payment_status,
            "return_date": tx.return_date.isoformat() if tx.return_date else None
        })
        
    return jsonify(result), 200

@payments_bp.route('/approve', methods=['POST'])
@jwt_required()
@role_required(['Admin', 'Incharge', 'Volunteer'])
def approve_payment():
    data = request.get_json()
    tx_ids = data.get('transaction_ids', [])
    method = data.get('method', 'Cash')
    
    if not tx_ids:
        return jsonify({"error": "No transactions selected"}), 400
        
    for tx_id in tx_ids:
        tx = Transaction.query.get(tx_id)
        if tx:
            tx.payment_status = 'PAID'
            tx.payment_method = method
            # Log who collected partial info? 
            # Could add collected_by_id to model but simple update is fine for now.
            
    db.session.commit()
    return jsonify({"message": "Payments approved successfully"}), 200

@payments_bp.route('/stats', methods=['GET'])
@jwt_required()
@role_required(['Admin', 'Incharge', 'Volunteer'])
def get_payment_stats():
    # Total Collected (All Time)
    total_rent_collected = db.session.query(db.func.sum(Transaction.rent_amount)).filter(Transaction.payment_status == 'PAID').scalar() or 0
    total_fine_collected = db.session.query(db.func.sum(Transaction.fine_accrued)).filter(Transaction.payment_status == 'PAID').scalar() or 0
    
    # Total Pending (All Time)
    total_rent_pending = db.session.query(db.func.sum(Transaction.rent_amount)).filter(Transaction.payment_status.in_(['PENDING', 'REQUESTED'])).scalar() or 0
    total_fine_pending = db.session.query(db.func.sum(Transaction.fine_accrued)).filter(Transaction.payment_status.in_(['PENDING', 'REQUESTED'])).scalar() or 0

    return jsonify({
        "total_collected": total_rent_collected + total_fine_collected,
        "rent_collected": total_rent_collected,
        "fine_collected": total_fine_collected,
        "total_pending": total_rent_pending + total_fine_pending,
        "rent_pending": total_rent_pending,
        "fine_pending": total_fine_pending
    }), 200
