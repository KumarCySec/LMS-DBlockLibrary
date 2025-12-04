from flask import Blueprint, request, send_file
from extensions import db
from models import InventoryItem, InventoryCopy, Donor, User
from flask_jwt_extended import jwt_required
from utils.decorators import role_required
import pandas as pd
import io
from datetime import datetime

inventory_export_bp = Blueprint('inventory_export', __name__)

@inventory_export_bp.route('/master', methods=['GET'])
@jwt_required()
@role_required(['Admin', 'Incharge'])
def export_master_inventory():
    # Join Item, Copy, and Donor
    # We want a row for every COPY.
    
    query = db.session.query(InventoryCopy, InventoryItem, Donor).join(InventoryItem).outerjoin(Donor, InventoryItem.donor_id == Donor.id).all()
    
    data = []
    for copy, item, donor in query:
        data.append({
            "Accession No": copy.acc_no,
            "Title": item.title,
            "Author": item.author,
            "Type": item.type,
            "Language": item.language,
            "Publisher": item.publisher,
            "Edition": item.edition,
            "Year": item.year,
            "Price": item.price,
            "ISBN": item.isbn,
            "Model": item.model,
            "Serial No": item.serial_no,
            "Status": copy.status,
            "Donor Name": donor.name if donor else "N/A",
            "Donor Branch": donor.branch if donor else "",
            "Donor Batch": donor.batch if donor else "",
            "Date Received": copy.date_received.strftime('%Y-%m-%d') if copy.date_received else ""
        })
        
    df = pd.DataFrame(data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='Master Inventory')
        
    output.seek(0)
    
    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=f'Master_Inventory_{datetime.now().strftime("%Y-%m-%d")}.xlsx'
    )

@inventory_export_bp.route('/summary', methods=['GET'])
@jwt_required()
@role_required(['Admin', 'Incharge'])
def export_inventory_summary():
    # One row per ITEM, with counts
    items = InventoryItem.query.all()
    
    data = []
    for item in items:
        data.append({
            "ID": item.id,
            "Title": item.title,
            "Author/Model": item.author or item.model,
            "Type": item.type,
            "Language": item.language,
            "Total Copies": item.quantity_total,
            "Available": item.quantity_available,
            "Donor": item.donor.name if item.donor else "N/A"
        })
        
    df = pd.DataFrame(data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='Inventory Summary')
        
    output.seek(0)
    
    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=f'Inventory_Summary_{datetime.now().strftime("%Y-%m-%d")}.xlsx'
    )

@inventory_export_bp.route('/users', methods=['GET'])
@jwt_required()
@role_required(['Admin'])
def export_users():
    users = User.query.all()
    
    data = []
    for user in users:
        data.append({
            "ID": user.id,
            "Name": user.name,
            "Email": user.email,
            "Role": user.role,
            "Roll No": user.roll_number,
            "Department": user.department.name if user.department else "",
            "Batch": user.batch,
            "Phone": user.phone_number,
            "Status": user.status,
            "Books Read": user.books_read,
            "Current Borrowings": user.current_borrowings,
            "Created At": user.created_at.strftime('%Y-%m-%d') if user.created_at else ""
        })
        
    df = pd.DataFrame(data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='Users')
        
    output.seek(0)
    
    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=f'Users_{datetime.now().strftime("%Y-%m-%d")}.xlsx'
    )

@inventory_export_bp.route('/donors', methods=['GET'])
@jwt_required()
@role_required(['Admin', 'Incharge'])
def export_donors():
    donors = Donor.query.all()
    
    data = []
    for donor in donors:
        data.append({
            "ID": donor.id,
            "Name": donor.name,
            "Email": donor.email,
            "Phone": donor.phone,
            "Branch": donor.branch,
            "Batch": donor.batch,
            "Total Items Donated": len(donor.donated_items)
        })
        
    df = pd.DataFrame(data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='Donors')
        
    output.seek(0)
    
    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=f'Donors_{datetime.now().strftime("%Y-%m-%d")}.xlsx'
    )
