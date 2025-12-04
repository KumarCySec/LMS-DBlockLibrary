from flask import Blueprint, request, jsonify
from extensions import db
from models import InventoryItem, InventoryCopy, Donor, Department, User
from datetime import datetime
import csv
import io
from flask_jwt_extended import jwt_required
from utils.decorators import permission_required

import_bp = Blueprint('import', __name__)

def parse_date(date_str):
    if not date_str:
        return None
    # Handle Excel serial dates if any (though usually CSV is text)
    # Common formats
    formats = (
        '%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y', 
        '%d-%b-%y', '%d-%b-%Y', # 04-Dec-25, 04-Dec-2025
        '%d/%m/%y', # 04/12/25
        '%m/%d/%Y', # 12/04/2025 (US)
        '%Y/%m/%d',
        '%d.%m.%Y', '%d.%m.%y' # Dot separator
    )
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            pass
    print(f"Failed to parse date: {date_str}")
    return None

@import_bp.route('/csv', methods=['POST'])
@jwt_required()
@permission_required('manage_inventory') # Admin or Incharge
def import_csv():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if not file.filename.endswith('.csv'):
        return jsonify({"error": "File must be a CSV"}), 400

    try:
        stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
        csv_input = csv.DictReader(stream)
        
        stats = {
            "processed": 0,
            "items_created": 0,
            "copies_created": 0,
            "donors_created": 0,
            "errors": []
        }

        for row in csv_input:
            stats["processed"] += 1
            try:
                # Clean row data: Strip keys AND values
                data = {}
                for k, v in row.items():
                    key = k.strip() if k else None
                    val = v.strip() if v and v.strip() else None
                    if key:
                        data[key] = val
                
                # Required fields
                acc_no = data.get('Acc No.')
                title = data.get('Book Name')
                
                if not acc_no or not title:
                    stats["errors"].append(f"Row {stats['processed']}: Missing Acc No. or Book Name")
                    continue

                # --- Donor ---
                donor = None
                donor_name = data.get('Book Donated')
                if donor_name:
                    # Try to find existing donor
                    donor = Donor.query.filter_by(name=donor_name).first()
                    if not donor:
                        donor = Donor(
                            name=donor_name,
                            branch=data.get('Branch'),
                            batch=data.get('Year Passed out')
                        )
                        db.session.add(donor)
                        db.session.flush() # Get ID
                        stats["donors_created"] += 1
                    else:
                        # Update missing info if available
                        if not donor.branch and data.get('Branch'):
                            donor.branch = data.get('Branch')
                        if not donor.batch and data.get('Year Passed out'):
                            donor.batch = data.get('Year Passed out')

                # --- Inventory Item ---
                author = data.get('Author')
                # Try to find existing item
                item = InventoryItem.query.filter_by(title=title, author=author).first()
                if not item:
                    item = InventoryItem(
                        title=title,
                        author=author,
                        language=data.get('Language'),
                        type='Book', # Default
                        quantity_total=0,
                        quantity_available=0,
                        donor_id=donor.id if donor else None, # Primary donor
                        date_of_donation=parse_date(data.get('Date Received')) # Set date_of_donation
                    )
                    db.session.add(item)
                    db.session.flush()
                    stats["items_created"] += 1
                else:
                    # Update language if missing
                    if not item.language and data.get('Language'):
                        item.language = data.get('Language')
                    # Always update date_of_donation if present in CSV
                    if data.get('Date Received'):
                        parsed_date = parse_date(data.get('Date Received'))
                        if parsed_date:
                            item.date_of_donation = parsed_date
                
                # --- Inventory Copy ---
                copy = InventoryCopy.query.filter_by(acc_no=acc_no).first()
                if not copy:
                    copy = InventoryCopy(
                        acc_no=acc_no,
                        inventory_item_id=item.id,
                        donor_id=donor.id if donor else None,
                        status='AVAILABLE',
                        date_of_entry=parse_date(data.get('Date of Entry')),
                        date_received=parse_date(data.get('Date Received'))
                    )
                    db.session.add(copy)
                    stats["copies_created"] += 1
                    
                    # Update Item counts
                    item.quantity_total += 1
                    item.quantity_available += 1
                else:
                    # Update copy info?
                    if not copy.donor_id and donor:
                        copy.donor_id = donor.id
                    if data.get('Date of Entry'):
                        copy.date_of_entry = parse_date(data.get('Date of Entry'))
                    if data.get('Date Received'):
                        copy.date_received = parse_date(data.get('Date Received'))
                
            except Exception as e:
                stats["errors"].append(f"Row {stats['processed']}: {str(e)}")
                db.session.rollback()
                continue
        
        db.session.commit()
        return jsonify(stats), 200

    except Exception as e:
        return jsonify({"error": "Failed to process CSV", "details": str(e)}), 500

@import_bp.route('/clear', methods=['POST'])
@jwt_required()
@permission_required('manage_inventory')
def clear_data():
    try:
        # Clear Inventory Data (Cascade should handle copies, but let's be safe)
        # We need to be careful about Transactions. If we clear inventory, transactions will break or cascade delete.
        # Assuming "fresh import" means we can clear transactions too or we accept they will be lost/archived.
        # For safety, let's only clear if no active transactions? Or just force clear?
        # User said "clear this half imported database", implying a reset.
        
        # Delete in order to respect FKs
        InventoryCopy.query.delete()
        InventoryItem.query.delete()
        # Donors might be kept? User said "half imported database", maybe donors too.
        # But donors might be linked to other things? 
        # Let's clear Donors created today? Or just all? 
        # Safer to clear all inventory and donors if they are just for this import.
        Donor.query.delete()
        
        db.session.commit()
        return jsonify({"message": "Inventory and Donor data cleared successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to clear data", "details": str(e)}), 500
