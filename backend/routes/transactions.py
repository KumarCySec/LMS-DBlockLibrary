from flask import Blueprint, request, jsonify
from extensions import db
from models import Transaction, InventoryItem, User, AppSetting, Notification, Waitlist
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from utils.decorators import role_required, permission_required

transactions_bp = Blueprint('transactions', __name__)

from utils.notifications import send_notification, notify_roles

@transactions_bp.route('/', methods=['GET'])
@jwt_required()
@role_required(['Admin', 'Incharge', 'Volunteer'])
def list_transactions():
    try:
        status_filter = request.args.get('status')
        query = Transaction.query
        
        if status_filter:
            query = query.filter_by(status=status_filter)
            
        # Sort by ID desc as proxy for time if created_at missing, or add created_at to model if needed. 
        # Assuming ID is auto-increment.
        txs = query.order_by(Transaction.id.desc()).all()
        
        result = []
        for tx in txs:
            try:
                result.append({
                    "id": tx.id,
                    "transaction_id": tx.transaction_id,
                    "inventory_item_id": tx.inventory_item_id,
                    "item_title": tx.item.title if tx.item else "Unknown",
                    "item_type": tx.item.type if tx.item else "Unknown",
                    "copy_acc_no": tx.copy.acc_no if tx.copy else "N/A",
                    "borrower_name": tx.borrower.name if tx.borrower else "Unknown",
                    "borrower_roll": tx.borrower.roll_number if tx.borrower else "Unknown",
                    "borrower_dept": tx.borrower.department.name if tx.borrower and tx.borrower.department else "N/A",
                    "status": tx.status,
                    "issue_date": tx.issue_date.isoformat() if tx.issue_date else None,
                    "due_date": tx.due_date.isoformat() if tx.due_date else None,
                    "return_date": tx.return_date.isoformat() if tx.return_date else None,
                    "fine": tx.fine_accrued,
                    "approved_by": tx.approved_by.name if tx.approved_by else None,
                    "rejected_by": tx.rejected_by.name if tx.rejected_by else None,
                    "rejection_reason": getattr(tx, 'rejection_reason', None),
                    "return_approved_by": tx.processed_by.name if tx.processed_by and tx.status == 'RETURNED' else None
                })
            except Exception as e:
                print(f"Error processing tx {tx.id}: {e}")
                continue
        return jsonify(result), 200
    except Exception as e:
        print(f"Error in list_transactions: {e}")
        return jsonify({"error": str(e)}), 500

@transactions_bp.route('/request', methods=['POST'])
@jwt_required()
def request_checkout():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    item_id = data.get('item_id')
    acc_no = data.get('acc_no') # Optional if only one copy or auto-assign
    
    item = InventoryItem.query.get_or_404(item_id)
    
    # Check Category Limit
    # Find active transactions for this user with same item type
    active_tx_same_type = Transaction.query.join(InventoryItem).filter(
        Transaction.borrower_id == current_user_id,
        InventoryItem.type == item.type,
        Transaction.status.in_(['REQUESTED', 'APPROVED', 'ISSUED', 'OVERDUE', 'RENEW_REQUESTED'])
    ).first()
    
    if active_tx_same_type:
        return jsonify({
            "error": "category_limit", 
            "message": f"You already have a {item.type} checked out or requested. Please return it first."
        }), 409

    if item.quantity_available < 1:
        return jsonify({"error": "Item not available"}), 400
        
    # Check if user already has this specific item active (redundant with category check but good for safety)
    existing_tx = Transaction.query.filter_by(
        borrower_id=current_user_id, 
        inventory_item_id=item_id
    ).filter(Transaction.status.in_(['REQUESTED', 'APPROVED', 'ISSUED'])).first()
    
    if existing_tx:
        return jsonify({"error": "You already have a request or active checkout for this item"}), 400

    # Handle Copy Selection
    from models import InventoryCopy
    copy = None
    if acc_no:
        copy = InventoryCopy.query.filter_by(acc_no=acc_no, inventory_item_id=item_id).first()
        if not copy:
            return jsonify({"error": "Invalid Accession Number"}), 400
        if copy.status != 'AVAILABLE':
            return jsonify({"error": "Selected copy is not available"}), 400
    else:
        # Auto-assign a copy if not provided? Or require it? 
        # Requirement says "Checkout must use Acc No selection".
        # But for backward compatibility or ease, maybe auto-select first available.
        # Let's try to find one.
        copy = InventoryCopy.query.filter_by(inventory_item_id=item_id, status='AVAILABLE').first()
        # If no copies exist in DB (legacy items), we might proceed without copy_id, 
        # but new requirement implies strict copy tracking. 
        # For now, allow proceed if no copies defined, but if copies exist, require one.
        if not copy and InventoryCopy.query.filter_by(inventory_item_id=item_id).count() > 0:
             return jsonify({"error": "No available copies found"}), 400

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
    perms = user.get_all_permissions()
    has_auto_issue = 'staff_checkout' in perms
    
    status = 'REQUESTED'
    issue_date = None
    due_date = None
    approved_by_id = None
    
    if has_auto_issue:
        status = 'ISSUED'
        issue_date = datetime.utcnow()
        approved_by_id = current_user_id
        item.quantity_available -= 1
        if copy:
            copy.status = 'ISSUED'
        
        default_due_days = AppSetting.query.get('default_due_days')
        days = int(default_due_days.value) if default_due_days else 14
        due_date = datetime.utcnow() + timedelta(days=days)

    new_tx = Transaction(
        transaction_id=tx_id,
        inventory_item_id=item_id,
        copy_id=copy.id if copy else None,
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
            f"{user.name} ({user.roll_number}) has requested {item.title}.",
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
            
        # Check copy availability if linked
        if tx.copy_id:
            from models import InventoryCopy
            copy = InventoryCopy.query.get(tx.copy_id)
            if copy and copy.status != 'AVAILABLE':
                 return jsonify({"error": "Assigned copy is no longer available"}), 400
            if copy:
                copy.status = 'ISSUED'

        item.quantity_available -= 1
        tx.status = 'ISSUED'
        tx.approved_by_id = current_user_id
        tx.issue_date = datetime.utcnow()
        
        # Calculate Due Date
        default_due_days = AppSetting.query.get('default_due_days')
        days = int(default_due_days.value) if default_due_days else 14
        tx.due_date = datetime.utcnow() + timedelta(days=days)
        
        # Notify User
        related_transaction_id=tx.id
        
        
        # Log Activity
        from models.misc import ActivityLog
        activity = ActivityLog(
            user_id=current_user_id,
            action_type='CHECKOUT',
            details=f"Issued {item.title} to {tx.borrower.name} ({tx.borrower.roll_number})",
            ip_address=request.remote_addr
        )
        db.session.add(activity)
        
    elif action == 'reject':
        tx.status = 'REJECTED'
        tx.rejected_by_id = current_user_id
        reason = data.get('reason')
        if reason:
            tx.rejection_reason = reason
        
        # Notify User
        send_notification(
            tx.borrower_id,
            'checkout_rejected',
            'Checkout Rejected',
            f'Your request for {tx.item.title} has been rejected. Reason: {reason}' if reason else f'Your request for {tx.item.title} has been rejected.',
            related_transaction_id=tx.id
        )
        
    else:
        return jsonify({"error": "Invalid action"}), 400
        
    db.session.commit()
    return jsonify({"message": f"Transaction {action}d successfully"}), 200

@transactions_bp.route('/<int:tx_id>/request-return', methods=['POST'])
@jwt_required()
def request_return(tx_id):
    current_user_id = get_jwt_identity()
    tx = Transaction.query.get_or_404(tx_id)
    data = request.get_json()
    feedback = data.get('feedback')

    if tx.borrower_id != int(current_user_id):
        return jsonify({"error": "Unauthorized"}), 403

    if tx.status not in ['ISSUED', 'OVERDUE']:
        return jsonify({"error": "Item is not currently issued"}), 400

    # Check user role for auto-return
    user = User.query.get(current_user_id)
    is_student = False
    if user.role == 'Student':
        is_student = True
    elif user.roles and 'Student' in [r.name for r in user.roles]:
        is_student = True

    if not is_student:
        # Auto-return for staff
        item = InventoryItem.query.get(tx.inventory_item_id)
        item.quantity_available += 1
        
        if tx.copy_id:
            from models import InventoryCopy
            copy = InventoryCopy.query.get(tx.copy_id)
            if copy:
                copy.status = 'AVAILABLE'
        
        tx.status = 'RETURNED'
        tx.return_date = datetime.utcnow()
        tx.processed_by_id = current_user_id
        tx.processed_at = datetime.utcnow()
        
        # Calculate Fine
        if tx.return_date > tx.due_date:
            fine_per_day = AppSetting.query.get('fine_per_day')
            rate = float(fine_per_day.value) if fine_per_day else 10.0
            overdue_days = (tx.return_date - tx.due_date).days
            tx.fine_accrued = max(0, overdue_days * rate)
            
        db.session.commit()
        return jsonify({"message": "Item returned successfully (Auto-Staff)", "fine": tx.fine_accrued}), 200

    tx.status = 'RETURN_REQUESTED'
    tx.return_feedback = feedback
    tx.return_request_date = datetime.utcnow()
    
    db.session.commit()

    # Notify Staff
    notify_roles(
        ['Volunteer', 'Incharge', 'Admin'],
        'return_request',
        'Return Request',
        f"{user.name} ({user.roll_number}) has requested to return {tx.item.title}.",
        related_transaction_id=tx.id
    )

    return jsonify({"message": "Return requested successfully"}), 200

@transactions_bp.route('/<int:tx_id>/approve-return', methods=['POST'])
@jwt_required()
@permission_required('approve_return')
def approve_return(tx_id):
    current_user_id = get_jwt_identity()
    tx = Transaction.query.get_or_404(tx_id)
    data = request.get_json() or {}
    action = data.get('action', 'approve') # Default to approve for backward compatibility
    reason = data.get('reason')
    
    if tx.status not in ['ISSUED', 'OVERDUE', 'RETURN_REQUESTED']:
        return jsonify({"error": "Invalid transaction status for return"}), 400

    if action == 'reject':
        if not reason:
            return jsonify({"error": "Rejection reason is required"}), 400
            
        # Revert status to ISSUED or OVERDUE based on due date
        if tx.due_date and datetime.utcnow() > tx.due_date:
            tx.status = 'OVERDUE'
        else:
            tx.status = 'ISSUED'
            
        tx.rejection_reason = reason
        tx.rejected_by_id = current_user_id
        tx.return_request_date = None # Clear request date
        
        db.session.commit()
        
        # Notify User
        send_notification(
            tx.borrower_id,
            'return_rejected',
            'Return Request Rejected',
            f'Your return request for {tx.item.title} was rejected. Reason: {reason}',
            related_transaction_id=tx.id
        )
        
        return jsonify({"message": "Return request rejected"}), 200
        
    # Approval Logic
    item = InventoryItem.query.get(tx.inventory_item_id)
    item.quantity_available += 1
    
    # Update copy status
    if tx.copy_id:
        from models import InventoryCopy
        copy = InventoryCopy.query.get(tx.copy_id)
        if copy:
            copy.status = 'AVAILABLE'
    
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
    related_transaction_id=tx.id
    
    
    # Log Activity
    from models.misc import ActivityLog
    activity = ActivityLog(
        user_id=current_user_id,
        action_type='RETURN',
        details=f"Returned {item.title} from {tx.borrower.name} ({tx.borrower.roll_number})",
        ip_address=request.remote_addr
    )
    db.session.add(activity)
    
    # Check Waitlist
    next_in_line = Waitlist.query.filter_by(
        inventory_item_id=item.id,
        status='QUEUED'
    ).order_by(Waitlist.created_at.asc()).first()
    
    if next_in_line:
        send_notification(
            next_in_line.requester_id,
            'item_available',
            'Book Available',
            f"{item.title} is now available! Please checkout immediately.",
            related_transaction_id=None
        )
    
    return jsonify({"message": "Item returned successfully", "fine": tx.fine_accrued}), 200

@transactions_bp.route('/<int:tx_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_request(tx_id):
    current_user_id = get_jwt_identity()
    tx = Transaction.query.get_or_404(tx_id)
    
    if tx.borrower_id != int(current_user_id):
        return jsonify({"error": "Unauthorized"}), 403
        
    if tx.status not in ['RENEW_REQUESTED', 'RETURN_REQUESTED', 'REQUESTED']:
        return jsonify({"error": "Cannot cancel this request"}), 400
        
    if tx.status == 'REQUESTED':
        # If it was just a checkout request, we can just delete it or mark as cancelled
        # For history tracking, let's mark as CANCELLED
        tx.status = 'CANCELLED'
        # Also need to free up the copy if it was reserved? 
        # In current logic, copy is assigned at approval, so nothing to free yet usually.
        # But if we reserved it at request time, we would need to free it.
        # Assuming simple request flow where copy is assigned later.
    elif tx.status == 'RENEW_REQUESTED':
        # Revert to ISSUED or OVERDUE
        if tx.due_date and datetime.utcnow() > tx.due_date:
            tx.status = 'OVERDUE'
        else:
            tx.status = 'ISSUED'
    elif tx.status == 'RETURN_REQUESTED':
        # Revert to ISSUED or OVERDUE
        if tx.due_date and datetime.utcnow() > tx.due_date:
            tx.status = 'OVERDUE'
        else:
            tx.status = 'ISSUED'
            
    db.session.commit()
    return jsonify({"message": "Request cancelled successfully"}), 200

@transactions_bp.route('/<int:tx_id>/renew_request', methods=['POST'])
@jwt_required()
def request_renewal(tx_id):
    current_user_id = get_jwt_identity()
    tx = Transaction.query.get_or_404(tx_id)
    
    if tx.borrower_id != int(current_user_id):
        return jsonify({"error": "Unauthorized"}), 403
        
    if tx.status != 'ISSUED':
        return jsonify({"error": "Only issued items can be renewed"}), 400
        
    # Check max renewals
    max_renewals_setting = AppSetting.query.get('max_renewals')
    max_renewals = int(max_renewals_setting.value) if max_renewals_setting else 2
    
    if (tx.renewal_count or 0) >= max_renewals:
        return jsonify({"error": f"Max renewals ({max_renewals}) reached"}), 400
        
    # Check user role for auto-approval
    user = User.query.get(current_user_id)
    is_student = False
    if user.role == 'Student':
        is_student = True
    elif user.roles and 'Student' in [r.name for r in user.roles]:
        is_student = True
        
    if not is_student:
        # Auto-approve for staff
        default_due_days = AppSetting.query.get('default_due_days')
        days = int(default_due_days.value) if default_due_days else 14
        
        tx.due_date = tx.due_date + timedelta(days=days)
        tx.renewal_count = (tx.renewal_count or 0) + 1
        tx.status = 'ISSUED'
        tx.processed_by_id = current_user_id
        tx.processed_at = datetime.utcnow()
        
        db.session.commit()
        return jsonify({"message": "Renewal approved (Auto-Staff)", "new_due_date": tx.due_date.isoformat()}), 200

    tx.status = 'RENEW_REQUESTED'
    db.session.commit()
    
    # Notify Staff
    notify_roles(
        ['Volunteer', 'Incharge', 'Admin'],
        'renew_request',
        'Renewal Request',
        f"{user.name} ({user.roll_number}) has requested renewal for {tx.item.title}.",
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
        
        related_transaction_id=tx.id
        
        
        # Log Activity
        from models.misc import ActivityLog
        activity = ActivityLog(
            user_id=get_jwt_identity(),
            action_type='RENEW',
            details=f"Renewed {tx.item.title} for {tx.borrower.name} ({tx.borrower.roll_number})",
            ip_address=request.remote_addr
        )
        db.session.add(activity)
        
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
    try:
        current_user_id = get_jwt_identity()
        txs = Transaction.query.filter_by(borrower_id=current_user_id).order_by(Transaction.id.desc()).all()
        
        result = []
        for tx in txs:
            try:
                item_title = "Unknown"
                if tx.item:
                    item_title = tx.item.title
                
                result.append({
                    "id": tx.id,
                    "transaction_id": tx.transaction_id,
                    "inventory_item_id": tx.inventory_item_id,
                    "item_title": item_title,
                    "status": tx.status,
                    "issue_date": tx.issue_date,
                    "due_date": tx.due_date,
                    "return_date": tx.return_date,
                    "fine": tx.fine_accrued,
                    "fine": tx.fine_accrued,
                    "rejection_reason": tx.rejection_reason,
                    "renewal_count": tx.renewal_count or 0
                })
            except:
                continue
                
        return jsonify(result), 200
    except Exception as e:
        # Return empty list on failure instead of 500
        return jsonify([]), 200

