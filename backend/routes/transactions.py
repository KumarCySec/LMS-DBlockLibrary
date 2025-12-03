from flask import Blueprint, request, jsonify
from extensions import db
from models import Transaction, InventoryItem, User, AppSetting, Notification
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from utils.decorators import role_required, permission_required

transactions_bp = Blueprint('transactions', __name__)

from utils.notifications import send_notification, notify_roles

@transactions_bp.route('/', methods=['GET'])
@jwt_required()
@role_required(['Admin', 'Incharge', 'Volunteer'])
def list_transactions():
    status_filter = request.args.get('status')
    query = Transaction.query
    
    if status_filter:
        query = query.filter_by(status=status_filter)
        
    # Sort by ID desc as proxy for time if created_at missing, or add created_at to model if needed. 
    # Assuming ID is auto-increment.
    txs = query.order_by(Transaction.id.desc()).all()
    
    result = []
    for tx in txs:
        result.append({
            "id": tx.id,
            "transaction_id": tx.transaction_id,
            "item_title": tx.item.title,
            "borrower_name": tx.borrower.name,
            "status": tx.status,
            "issue_date": tx.issue_date,
            "due_date": tx.due_date,
            "return_date": tx.return_date,
            "fine": tx.fine_accrued
        })
    return jsonify(result), 200

@transactions_bp.route('/request', methods=['POST'])
@jwt_required()
def request_checkout():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    item_id = data.get('item_id')
    
    item = InventoryItem.query.get_or_404(item_id)
    
    if item.quantity_available < 1:
        return jsonify({"error": "Item not available"}), 400
        
    # Check if user already has this item active
    existing_tx = Transaction.query.filter_by(
        borrower_id=current_user_id, 
        inventory_item_id=item_id
    ).filter(Transaction.status.in_(['REQUESTED', 'APPROVED', 'ISSUED'])).first()
    
    if existing_tx:
        return jsonify({"error": "You already have a request or active checkout for this item"}), 400

    # Create Transaction
    # Format: DBL-YYYY-XXXX (e.g. DBL-2025-0001)
    year = datetime.utcnow().year
    # Get count of transactions this year to generate sequence
    count = Transaction.query.filter(Transaction.transaction_id.like(f"DBL-{year}-%")).count()
    sequence = count + 1
    tx_id = f"DBL-{year}-{sequence:04d}"

    # Check for auto-issue permission
    user = User.query.get(current_user_id)
    # Check if user has 'staff_checkout' permission
    has_auto_issue = False
    for role in user.roles:
        for perm in role.permissions:
            if perm.name == 'staff_checkout':
                has_auto_issue = True
                break
        if has_auto_issue: break
    
    status = 'REQUESTED'
    issue_date = None
    due_date = None
    approved_by_id = None
    
    if has_auto_issue:
        status = 'ISSUED'
        issue_date = datetime.utcnow()
        approved_by_id = current_user_id
        item.quantity_available -= 1
        
        default_due_days = AppSetting.query.get('default_due_days')
        days = int(default_due_days.value) if default_due_days else 14
        due_date = datetime.utcnow() + timedelta(days=days)

    new_tx = Transaction(
        transaction_id=tx_id,
        inventory_item_id=item_id,
        borrower_id=current_user_id,
        requested_by_id=current_user_id,
        status=status,
        issue_date=issue_date,
        due_date=due_date,
        approved_by_id=approved_by_id
    )
    
    db.session.add(new_tx)
    db.session.commit()
    
    if status == 'REQUESTED':
        # Notify Staff
        notify_roles(
            ['Volunteer', 'Incharge', 'Admin'],
            'checkout_request',
            'New Checkout Request',
            f"User has requested {item.title}.",
            related_transaction_id=new_tx.id
        )
        return jsonify({"message": "Checkout requested successfully", "transaction_id": tx_id, "status": "REQUESTED"}), 201
    else:
        return jsonify({
            "message": f"Item issued successfully. Due: {due_date.strftime('%Y-%m-%d')}", 
            "transaction_id": tx_id, 
            "status": "ISSUED",
            "due_date": due_date.isoformat()
        }), 200

@transactions_bp.route('/<int:tx_id>/approve', methods=['POST'])
@jwt_required()
@permission_required('approve_checkout')
def approve_checkout(tx_id):
    current_user_id = get_jwt_identity()
    tx = Transaction.query.get_or_404(tx_id)
    data = request.get_json()
    action = data.get('action') # 'approve' or 'reject'
    
    if tx.status != 'REQUESTED':
        return jsonify({"error": "Transaction is not in REQUESTED state"}), 400
        
    if action == 'approve':
        item = InventoryItem.query.get(tx.inventory_item_id)
        if item.quantity_available < 1:
            return jsonify({"error": "Item no longer available"}), 400
            
        item.quantity_available -= 1
        tx.status = 'ISSUED'
        tx.approved_by_id = current_user_id
        tx.issue_date = datetime.utcnow()
        
        # Calculate Due Date
        default_due_days = AppSetting.query.get('default_due_days')
        days = int(default_due_days.value) if default_due_days else 14
        tx.due_date = datetime.utcnow() + timedelta(days=days)
        
        # Notify User
        send_notification(
            tx.borrower_id,
            'checkout_approved',
            'Checkout Approved',
            f'Your request for {item.title} has been approved. Due date: {tx.due_date.strftime("%Y-%m-%d")}',
            related_transaction_id=tx.id
        )
        
    elif action == 'reject':
        tx.status = 'REJECTED'
        tx.rejected_by_id = current_user_id
        
        # Notify User
        send_notification(
            tx.borrower_id,
            'checkout_rejected',
            'Checkout Rejected',
            f'Your request for {tx.item.title} has been rejected.',
            related_transaction_id=tx.id
        )
        
    else:
        return jsonify({"error": "Invalid action"}), 400
        
    db.session.commit()
    return jsonify({"message": f"Transaction {action}d successfully"}), 200

@transactions_bp.route('/<int:tx_id>/return', methods=['POST'])
@jwt_required()
@permission_required('approve_return')
def return_item(tx_id):
    current_user_id = get_jwt_identity()
    tx = Transaction.query.get_or_404(tx_id)
    
    if tx.status not in ['ISSUED', 'OVERDUE', 'RETURN_REQUESTED']:
        return jsonify({"error": "Invalid transaction status for return"}), 400
        
    item = InventoryItem.query.get(tx.inventory_item_id)
    item.quantity_available += 1
    
    tx.status = 'RETURNED'
    tx.return_date = datetime.utcnow()
    tx.processed_by_id = current_user_id
    tx.processed_at = datetime.utcnow()
    
    # Calculate Fine (Final check)
    if tx.return_date > tx.due_date:
        fine_per_day = AppSetting.query.get('fine_per_day')
        rate = float(fine_per_day.value) if fine_per_day else 10.0
        overdue_days = (tx.return_date - tx.due_date).days
        tx.fine_accrued = max(0, overdue_days * rate)
        
    db.session.commit()
    
    # Notify User
    send_notification(
        tx.borrower_id,
        'item_returned',
        'Item Returned',
        f'You have successfully returned {item.title}.',
        related_transaction_id=tx.id
    )
    
    return jsonify({"message": "Item returned successfully", "fine": tx.fine_accrued}), 200

@transactions_bp.route('/<int:tx_id>/renew_request', methods=['POST'])
@jwt_required()
def request_renewal(tx_id):
    current_user_id = get_jwt_identity()
    tx = Transaction.query.get_or_404(tx_id)
    
    if tx.borrower_id != current_user_id:
        return jsonify({"error": "Unauthorized"}), 403
        
    if tx.status != 'ISSUED':
        return jsonify({"error": "Only issued items can be renewed"}), 400
        
    # Check max renewals
    max_renewals_setting = AppSetting.query.get('max_renewals')
    max_renewals = int(max_renewals_setting.value) if max_renewals_setting else 2
    
    if (tx.renewal_count or 0) >= max_renewals:
        return jsonify({"error": f"Max renewals ({max_renewals}) reached"}), 400
        
    tx.status = 'RENEW_REQUESTED'
    db.session.commit()
    
    # Notify Staff
    notify_roles(
        ['Volunteer', 'Incharge', 'Admin'],
        'renew_request',
        'Renewal Request',
        f"User has requested renewal for {tx.item.title}.",
        related_transaction_id=tx.id
    )
    
    return jsonify({"message": "Renewal requested successfully"}), 200

@transactions_bp.route('/<int:tx_id>/approve_renew', methods=['POST'])
@jwt_required()
@permission_required('approve_renew')
def approve_renewal(tx_id):
    tx = Transaction.query.get_or_404(tx_id)
    data = request.get_json()
    action = data.get('action') # 'approve' or 'reject'
    
    if tx.status != 'RENEW_REQUESTED':
        return jsonify({"error": "Transaction is not in RENEW_REQUESTED state"}), 400
        
    if action == 'approve':
        default_due_days = AppSetting.query.get('default_due_days')
        days = int(default_due_days.value) if default_due_days else 14
        
        tx.due_date = tx.due_date + timedelta(days=days)
        tx.renewal_count = (tx.renewal_count or 0) + 1
        tx.status = 'ISSUED'
        tx.processed_by_id = get_jwt_identity()
        tx.processed_at = datetime.utcnow()
        
        send_notification(
            tx.borrower_id,
            'renewal_approved',
            'Renewal Approved',
            f'Your renewal for {tx.item.title} is approved. New due date: {tx.due_date.strftime("%Y-%m-%d")}',
            related_transaction_id=tx.id
        )
        
    elif action == 'reject':
        tx.status = 'ISSUED' # Revert to ISSUED but don't extend date
        tx.processed_by_id = get_jwt_identity()
        tx.processed_at = datetime.utcnow()
        
        send_notification(
            tx.borrower_id,
            'renewal_rejected',
            'Renewal Rejected',
            f'Your renewal request for {tx.item.title} was rejected.',
            related_transaction_id=tx.id
        )
        
    db.session.commit()
    return jsonify({"message": f"Renewal {action}d"}), 200

@transactions_bp.route('/my', methods=['GET'])
@jwt_required()
def my_transactions():
    current_user_id = get_jwt_identity()
    txs = Transaction.query.filter_by(borrower_id=current_user_id).order_by(Transaction.created_at.desc() if hasattr(Transaction, 'created_at') else Transaction.id.desc()).all()
    
    result = []
    for tx in txs:
        result.append({
            "id": tx.id,
            "item_title": tx.item.title,
            "status": tx.status,
            "issue_date": tx.issue_date,
            "due_date": tx.due_date,
            "return_date": tx.return_date,
            "fine": tx.fine_accrued
        })
    return jsonify(result), 200
