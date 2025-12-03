from flask import Blueprint, request, jsonify
from extensions import db
from models import InventoryItem, Donor, Department
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, Role
from utils.decorators import role_required, permission_required

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
        query = query.filter_by(language=language_filter)
        
    if availability_filter == 'available':
        query = query.filter(InventoryItem.quantity_available > 0)
        
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (InventoryItem.title.ilike(search_term)) | 
            (InventoryItem.author.ilike(search_term))
        )
        
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
        
    new_item = InventoryItem(
        type=data['type'],
        title=data['title'],
        description=data.get('description'),
        quantity_total=data.get('quantity_total', 1),
        quantity_available=data.get('quantity_total', 1),
        donor_id=data.get('donor_id'),
        status='active',
        # Book fields
        author=data.get('author'),
        published_date=None, # TODO: Parse date
        language=data.get('language'),
        # Laptop/Kit fields
        model=data.get('model'),
        serial_number=data.get('serial_number'),
        specs=data.get('specs')
    )
    
    db.session.add(new_item)
    db.session.commit()
    
    return jsonify({"message": "Item added successfully", "id": new_item.id}), 201

@inventory_bp.route('/<int:item_id>', methods=['GET'])
@jwt_required()
def get_item_detail(item_id):
    item = InventoryItem.query.get_or_404(item_id)
    
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
            "name": item.donor.name
        } if item.donor else None,
        # Specifics
        "author": item.author,
        "language": item.language,
        "model": item.model,
        "specs": item.specs
    }), 200

# --- Donors ---

@inventory_bp.route('/donors', methods=['GET'])
@jwt_required()
def list_donors():
    search = request.args.get('search')
    query = Donor.query
    
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
