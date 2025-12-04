from flask import Blueprint, request, jsonify
from extensions import db
from models import InventoryItem, Donor, Department, Transaction, Waitlist, InventoryCopy, User, Role
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.decorators import role_required, permission_required
from datetime import datetime, date

inventory_bp = Blueprint('inventory', __name__)

# --- Inventory Items ---

@inventory_bp.route('/', methods=['GET'])
@jwt_required()
def list_inventory():
    type_filter = request.args.get('type')
    language_filter = request.args.get('language')
    availability_filter = request.args.get('availability') # 'available'
    search = request.args.get('search')
    sort = request.args.get('sort') # 'newest', 'oldest'
    
    query = InventoryItem.query
    
    if type_filter:
        query = query.filter_by(type=type_filter)
        
    if language_filter:
        query = query.filter(InventoryItem.language.ilike(language_filter))

    if availability_filter == 'available':
        query = query.filter(InventoryItem.quantity_available > 0)
        
    if search:
        search_term = f"%{search}%"
        query = query.outerjoin(InventoryCopy).filter(
            (InventoryItem.title.ilike(search_term)) | 
            (InventoryItem.author.ilike(search_term)) |
            (InventoryCopy.acc_no.ilike(search_term))
        ).distinct()
        
    if sort == 'newest':
        query = query.order_by(InventoryItem.id.desc())
    elif sort == 'oldest':
        query = query.order_by(InventoryItem.id.asc())
    # TODO: Add 'most_borrowed' if needed
        
    items = query.all()
    
    result = []
    for item in items:
        result.append({
            "id": item.id,
            "type": item.type,
            "title": item.title,
            "author": item.author,
            "language": item.language,
            "status": item.status,
            "quantity_available": item.quantity_available,
            "quantity_total": item.quantity_total
        })
        
    return jsonify(result), 200

@inventory_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('manage_inventory')
def add_inventory():
    data = request.get_json()
    
    # Basic validation
    if not data.get('title') or not data.get('type'):
        return jsonify({"error": "Title and Type are required"}), 400
        
    # Parse dates
    date_donation = datetime.utcnow().date()
    if data.get('date_of_donation'):
        try:
            date_donation = datetime.strptime(data['date_of_donation'], '%Y-%m-%d').date()
        except:
            pass
            
    # Handle Copies
    copies_data = data.get('copies', []) # List of acc_nos
    quantity = len(copies_data) if copies_data else int(data.get('quantity_total', 1))
    
    new_item = InventoryItem(
        type=data['type'],
        title=data['title'],
        description=data.get('description'),
        quantity_total=quantity,
        quantity_available=quantity,
        donor_id=data.get('donor_id'),
        status='active',
        # Book fields
        author=data.get('author'),
        published_date=None, 
        language=data.get('language'),
        date_of_donation=date_donation,
        # Laptop/Kit fields
        model=data.get('model'),
        serial_number=data.get('serial_number'),
        specs=data.get('specs')
    )
    
    db.session.add(new_item)
    db.session.flush() # Get ID
    
    # Create Copies
    if copies_data:
        for acc_no in copies_data:
            # Check duplicate
            if InventoryCopy.query.filter_by(acc_no=acc_no).first():
                db.session.rollback()
                return jsonify({"error": f"Accession Number {acc_no} already exists"}), 400
                
            copy = InventoryCopy(
                inventory_item_id=new_item.id,
                acc_no=acc_no,
                status='AVAILABLE',
                donor_id=data.get('donor_id'), # Link copy to donor too? Yes
                date_received=date_donation # Default to donation date if not specific
            )
            # If specific date_received provided for item, use it
            if data.get('date_received'):
                try:
                    copy.date_received = datetime.strptime(data['date_received'], '%Y-%m-%d').date()
                except:
                    pass
            
            db.session.add(copy)
            
    db.session.commit()
    
    return jsonify({"message": "Item added successfully", "id": new_item.id}), 201

@inventory_bp.route('/<int:item_id>', methods=['PUT'])
@jwt_required()
@permission_required('manage_inventory')
def update_inventory(item_id):
    item = InventoryItem.query.get_or_404(item_id)
    data = request.get_json()
    
    if 'title' in data:
        item.title = data['title']
    if 'description' in data:
        item.description = data['description']
    if 'author' in data:
        item.author = data['author']
    if 'language' in data:
        item.language = data['language']
    if 'model' in data:
        item.model = data['model']
    if 'specs' in data:
        item.specs = data['specs']
    if 'donor_id' in data:
        item.donor_id = data['donor_id']
        
    # Handle quantity updates carefully
    if 'quantity_total' in data:
        diff = int(data['quantity_total']) - item.quantity_total
        item.quantity_total = int(data['quantity_total'])
        item.quantity_available += diff
        
    db.session.commit()
    return jsonify({"message": "Item updated successfully"}), 200

@inventory_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_inventory_stats():
    try:
        total_items = InventoryItem.query.count()
        available_items = InventoryItem.query.filter(InventoryItem.quantity_available > 0).count()
        active_checkouts = Transaction.query.filter(Transaction.status.in_(['ISSUED', 'OVERDUE'])).count()
        overdue_items = Transaction.query.filter(Transaction.status == 'OVERDUE').count()
        
        return jsonify({
            "total_items": total_items,
            "available_items": available_items,
            "active_checkouts": active_checkouts,
            "overdue_items": overdue_items
        }), 200
    except Exception as e:
        # Log error if possible, but return safe defaults
        return jsonify({
            "total_items": 0,
            "available_items": 0,
            "active_checkouts": 0,
            "overdue_items": 0,
            "error": str(e) # Optional debug info
        }), 200

@inventory_bp.route('/<int:item_id>', methods=['GET'])
@jwt_required()
def get_item_detail(item_id):
    try:
        item = InventoryItem.query.get(item_id)
        if not item:
            return jsonify({"error": "Item not found"}), 404
        
        # Fetch current holders (ISSUED or OVERDUE)
        current_holders = []
        try:
            current_txs = Transaction.query.filter(
                Transaction.inventory_item_id == item_id,
                Transaction.status.in_(['ISSUED', 'OVERDUE'])
            ).all()
            
            for tx in current_txs:
                if not tx.borrower: continue
                current_holders.append({
                    "user_id": tx.borrower.id,
                    "name": tx.borrower.name,
                    "department": tx.borrower.department.name if tx.borrower.department else "N/A",
                    "batch": tx.borrower.batch,
                    "transaction_id": tx.transaction_id,
                    "issue_date": tx.issue_date.isoformat() if tx.issue_date else None,
                    "due_date": tx.due_date.isoformat() if tx.due_date else None,
                    "status": tx.status,
                    "renewal_count": tx.renewal_count,
                    "fine_accrued": tx.fine_accrued
                })
        except:
            pass

        # Fetch history (RETURNED) - limit to last 10
        history = []
        try:
            history_txs = Transaction.query.filter(
                Transaction.inventory_item_id == item_id,
                Transaction.status == 'RETURNED'
            ).order_by(Transaction.return_date.desc()).limit(10).all()
            
            for tx in history_txs:
                if not tx.borrower: continue
                history.append({
                    "user_id": tx.borrower.id,
                    "name": tx.borrower.name,
                    "department": tx.borrower.department.name if tx.borrower.department else "N/A",
                    "batch": tx.borrower.batch,
                    "transaction_id": tx.transaction_id,
                    "issue_date": tx.issue_date.isoformat() if tx.issue_date else None,
                    "return_date": tx.return_date.isoformat() if tx.return_date else None,
                    "duration_days": (tx.return_date - tx.issue_date).days if tx.return_date and tx.issue_date else 0,
                    "fine": tx.fine_accrued,
                    "approved_by": tx.approved_by.name if tx.approved_by else "System"
                })
        except:
            pass

        # Fetch waitlist (QUEUED)
        waitlist = []
        try:
            waitlist_entries = Waitlist.query.filter(
                Waitlist.inventory_item_id == item_id,
                Waitlist.status == 'QUEUED'
            ).order_by(Waitlist.created_at.asc()).all()
            
            for entry in waitlist_entries:
                if not entry.requester: continue
                waitlist.append({
                    "user_id": entry.requester.id,
                    "name": entry.requester.name,
                    "department": entry.requester.department.name if entry.requester.department else "N/A",
                    "batch": entry.requester.batch,
                    "requested_at": entry.created_at.isoformat()
                })
        except:
            pass

        # Create a map of copy_id to holder info from current_txs
        copy_holders = {}
        for tx in current_txs:
            if tx.copy_id and tx.borrower:
                copy_holders[tx.copy_id] = {
                    "name": tx.borrower.name,
                    "due_date": tx.due_date.isoformat() if tx.due_date else None,
                    "transaction_id": tx.transaction_id
                }

        # Copies
        copies = []
        try:
            if item.copies:
                copies = [{
                    "id": c.id,
                    "acc_no": c.acc_no,
                    "status": c.status,
                    "holder": copy_holders.get(c.id)
                } for c in item.copies]
        except:
            pass

        # Calculate latest donation date safely
        # Calculate latest donation date safely
        latest_date = None
        try:
            dates = []
            for c in item.copies:
                if c.date_received:
                    dates.append(c.date_received)
                        
            if item.date_of_donation:
                dates.append(item.date_of_donation)
            
            latest_date = max(dates).isoformat() if dates else None
        except Exception as e:
            print(f"Error calculating latest date: {e}")
            pass

        return jsonify({
            "id": item.id,
            "type": item.type,
            "title": item.title,
            "description": item.description,
            "quantity_total": item.quantity_total,
            "quantity_available": item.quantity_available,
            "status": item.status,
            "donor": {
                "id": item.donor.id,
                "name": item.donor.name,
                "branch": item.donor.branch,
                "batch": item.donor.batch
            } if item.donor else None,
            "date_of_donation": latest_date,
            # Specifics
            "author": item.author,
            "language": item.language,
            "model": item.model,
            "specs": item.specs,
            "current_holders": current_holders,
            "history": history,
            "waitlist": waitlist,
            "copies": copies
        }), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch item details", "details": str(e)}), 500

@inventory_bp.route('/<int:item_id>/copies', methods=['GET'])
@jwt_required()
def get_item_copies(item_id):
    from models import InventoryCopy
    item = InventoryItem.query.get_or_404(item_id)
    status_filter = request.args.get('status')
    
    query = InventoryCopy.query.filter_by(inventory_item_id=item_id)
    if status_filter:
        query = query.filter_by(status=status_filter)
        
    copies = query.all()
    return jsonify([{
        "id": c.id,
        "acc_no": c.acc_no,
        "status": c.status
    } for c in copies]), 200

@inventory_bp.route('/<int:item_id>/copies', methods=['POST'])
@jwt_required()
@permission_required('manage_inventory')
def add_item_copy(item_id):
    from models import InventoryCopy
    item = InventoryItem.query.get_or_404(item_id)
    data = request.get_json()
    
    acc_no = data.get('acc_no')
    if not acc_no:
        return jsonify({"error": "Accession Number (acc_no) is required"}), 400
        
    if InventoryCopy.query.filter_by(acc_no=acc_no).first():
        return jsonify({"error": "Accession Number already exists"}), 409
        
    new_copy = InventoryCopy(
        inventory_item_id=item_id,
        acc_no=acc_no,
        status='AVAILABLE'
    )
    
    db.session.add(new_copy)
    
    # Update total quantity
    item.quantity_total += 1
    item.quantity_available += 1
    
    db.session.commit()
    
    return jsonify({"message": "Copy added successfully", "id": new_copy.id}), 201

# --- Donors ---

@inventory_bp.route('/donors', methods=['GET'])
@jwt_required()
def list_donors():
    search = request.args.get('search')
    branch_filter = request.args.get('branch')
    batch_filter = request.args.get('batch')
    
    query = Donor.query
    
    if branch_filter:
        query = query.filter(Donor.branch.ilike(f"%{branch_filter}%"))
    if batch_filter:
        query = query.filter(Donor.batch.ilike(f"%{batch_filter}%"))
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Donor.name.ilike(search_term)) | 
            (Donor.branch.ilike(search_term)) | 
            (Donor.batch.ilike(search_term))
        )
        
    donors = query.all()
    return jsonify([{
        "id": d.id,
        "name": d.name,
        "branch": d.branch,
        "batch": d.batch,
        "email": d.email,
        "mobile_number": d.mobile_number
    } for d in donors]), 200

@inventory_bp.route('/donors', methods=['POST'])
@jwt_required()
@permission_required('manage_inventory')
def add_donor():
    data = request.get_json()
    if not data.get('name'):
        return jsonify({"error": "Name is required"}), 400
        
    new_donor = Donor(
        name=data['name'],
        branch=data.get('branch', 'Unknown'),
        batch=data.get('batch', 'Unknown'),
        address=data.get('address'),
        mobile_number=data.get('mobile_number'),
        email=data.get('email')
    )
    db.session.add(new_donor)
    db.session.commit()
    
    return jsonify({"message": "Donor added successfully", "id": new_donor.id}), 201

@inventory_bp.route('/donors/<int:donor_id>', methods=['PUT'])
@jwt_required()
@permission_required('manage_inventory')
def update_donor(donor_id):
    donor = Donor.query.get_or_404(donor_id)
    data = request.get_json()
    
    if 'name' in data:
        donor.name = data['name']
    if 'branch' in data:
        donor.branch = data['branch']
    if 'batch' in data:
        donor.batch = data['batch']
    if 'email' in data:
        donor.email = data['email']
    if 'mobile_number' in data:
        donor.mobile_number = data['mobile_number']
    if 'address' in data:
        donor.address = data['address']
        
    db.session.commit()
    return jsonify({"message": "Donor updated successfully"}), 200

@inventory_bp.route('/donors/<int:donor_id>', methods=['GET'])
@jwt_required()
def get_donor_detail(donor_id):
    donor = Donor.query.get_or_404(donor_id)
    
    # Get items donated (Primary donor)
    items = InventoryItem.query.filter_by(donor_id=donor_id).all()
    
    # Get copies donated (Specific copies)
    copies = InventoryCopy.query.filter_by(donor_id=donor_id).all()
    
    # Group donations by Item ID
    donations_map = {}
    
    # Process Items (Primary Donor)
    for item in items:
        if item.id not in donations_map:
            donations_map[item.id] = {
                "id": item.id,
                "title": item.title,
                "author": item.author,
                "date": item.date_of_donation,
                "copies_count": 0,
                "acc_nos": []
            }
            
    # Process Copies (Specific Copies)
    for copy in copies:
        item = copy.item
        if item.id not in donations_map:
            donations_map[item.id] = {
                "id": item.id,
                "title": item.title,
                "author": item.author,
                "date": copy.date_received, # Use copy date if item date missing
                "copies_count": 0,
                "acc_nos": []
            }
        
        # Update date if copy is newer
        copy_date = copy.date_received
        current_date = donations_map[item.id]["date"]
            
        if copy_date and current_date and copy_date > current_date:
             donations_map[item.id]["date"] = copy_date
        elif copy_date and not current_date:
             donations_map[item.id]["date"] = copy_date
             
        donations_map[item.id]["copies_count"] += 1
        donations_map[item.id]["acc_nos"].append(copy.acc_no)

    donations = []
    for item_id, data in donations_map.items():
        # If copies_count is 0, it means they are the primary donor but maybe copies aren't explicitly linked to them 
        # OR copies are linked to them but we already counted.
        # If primary donor, we assume at least 1 unless copies say otherwise?
        # Actually, if they are primary donor, usually all initial copies are theirs.
        # But our model links copies to donors too.
        # Let's trust the map. If copies_count is 0 but they are primary donor, it's likely the item itself represents the donation (e.g. 1 book).
        # But wait, we create copies for every item.
        # If copies_count is 0, it might mean the copies don't have donor_id set, but the item does.
        # In that case, we should probably count the item's total copies? Or just say "1 book"?
        # Let's say "1 copy" if count is 0 but it's in the list.
        
        count = data["copies_count"]
        if count == 0:
            count = 1 # Fallback
            
        donations.append({
            "type": "Book",
            "id": data["id"],
            "title": data["title"],
            "date": data["date"].isoformat() if data["date"] else None,
            "details": f"{count} {'Copy' if count == 1 else 'Copies'} ({', '.join(data['acc_nos'][:3])}{'...' if len(data['acc_nos']) > 3 else ''})"
        })

    return jsonify({
        "id": donor.id,
        "name": donor.name,
        "branch": donor.branch,
        "batch": donor.batch,
        "email": donor.email,
        "mobile_number": donor.mobile_number,
        "address": donor.address,
        "donations": donations
    }), 200
