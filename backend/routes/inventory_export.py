from flask import Blueprint, request, send_file
from extensions import db
from models import InventoryItem, InventoryCopy, Donor, User, Role
from flask_jwt_extended import jwt_required
from utils.decorators import role_required, permission_required
import pandas as pd
import io
from datetime import datetime
import traceback
from flask import jsonify

inventory_export_bp = Blueprint('inventory_export', __name__)

@inventory_export_bp.route('/master', methods=['GET'])
@jwt_required()
@role_required(['Admin', 'Incharge'])
def export_master_inventory():
    try:
        # Join Item, Copy, and Donor
        query = db.session.query(InventoryCopy, InventoryItem, Donor)\
            .select_from(InventoryCopy)\
            .join(InventoryItem, InventoryCopy.inventory_item_id == InventoryItem.id)\
            .outerjoin(Donor, InventoryItem.donor_id == Donor.id)\
            .all()
        
        data = []
        for copy, item, donor in query:
            
            # Determine year from published_date
            year = ""
            try:
                if item.published_date:
                    if isinstance(item.published_date, str):
                        # Try parsing if it's a string (legacy data?)
                        # Assuming YYYY-MM-DD
                        year = item.published_date[:4]
                    else:
                        year = item.published_date.year
            except:
                year = ""

            # Safe date string
            date_received_str = ""
            if copy.date_received:
                try:
                    date_received_str = copy.date_received.strftime('%d-%m-%Y')
                except:
                    date_received_str = str(copy.date_received)

            data.append({
                "Accession No": copy.acc_no,
                "Title": item.title,
                "Author": item.author,
                "Type": item.type,
                "Language": item.language,
                "Status": copy.status,
                "Donor Name": donor.name if donor else "N/A",
                "Donor Branch": donor.branch if donor else "",
                "Donor Batch": donor.batch if donor else "",
                "Date Received": date_received_str,
                "Year": year,
                "Model": item.model,
                "Serial Number": item.serial_number,
                "Specs": item.specs
            })
            
        df = pd.DataFrame(data)
        
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Master Inventory')
            
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'Master_Inventory_{datetime.now().strftime("%d-%m-%Y")}.xlsx'
        )
    except Exception as e:
        print(f"Export Error: {e}")
        traceback.print_exc()
        return jsonify({"error": "Export failed", "details": str(e)}), 500

@inventory_export_bp.route('/summary', methods=['GET'])
@jwt_required()
@role_required(['Admin', 'Incharge'])
def export_inventory_summary():
    try:
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
                "Available": item.quantity_available
            })
            
        df = pd.DataFrame(data)
        
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Inventory Summary')
            
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'Inventory_Summary_{datetime.now().strftime("%d-%m-%Y")}.xlsx'
        )
    except Exception as e:
        print(f"Export Error: {e}")
        traceback.print_exc()
        return jsonify({"error": "Export failed", "details": str(e)}), 500


@inventory_export_bp.route('/users', methods=['GET'])
@jwt_required()
@permission_required('manage_users')
def export_users():
    try:
        status = request.args.get('status')
        role_filter = request.args.get('role')
        department_id = request.args.get('department_id', type=int)
        batch = request.args.get('batch')
        
        query = User.query
        
        if status and status != 'all':
            query = query.filter_by(status=status)
        if role_filter:
            query = query.join(User.roles).filter(Role.name == role_filter) # Requires import Role
        if department_id:
            query = query.filter(User.department_id == department_id)
        if batch:
            query = query.filter(User.batch == batch)
            
        users = query.all()
        
        data = []
        for user in users:
            # Determine Role
            role_name = ""
            if user.roles:
                role_name = user.roles[0].name
                
            data.append({
                "ID": user.id,
                "Name": user.name,
                "Email": user.email,
                "Role": role_name,
                "Roll No": user.roll_number,
                "Department": user.department.name if user.department else "",
                "Batch": user.batch,
                "Phone": user.phone_number,
                "Status": user.status,
                "Created At": user.created_at.strftime('%d-%m-%Y') if user.created_at else ""
            })
            
        df = pd.DataFrame(data)
        
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Users')
            
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'Users_{datetime.now().strftime("%d-%m-%Y")}.xlsx'
        )
    except Exception as e:
        print(f"Export Error: {e}")
        traceback.print_exc()
        return jsonify({"error": "Export failed", "details": str(e)}), 500

@inventory_export_bp.route('/donors', methods=['GET'])
@jwt_required()
@role_required(['Admin', 'Incharge'])
def export_donors():
    try:
        branch_filter = request.args.get('branch')
        batch_filter = request.args.get('batch')
        
        query = Donor.query
        if branch_filter:
            query = query.filter(Donor.branch == branch_filter)
        if batch_filter:
            query = query.filter(Donor.batch == batch_filter)
            
        donors = query.all()
        
        data = []
        for donor in donors:
            # Calculate Total Items Donated (Unique Titles)
            total_donated = len(donor.donations) # Using the relationship back to InventoryItems
            
            data.append({
                "ID": donor.id,
                "Name": donor.name,
                "Branch": donor.branch,
                "Batch": donor.batch,
                "Total Items Donated": total_donated,
                "Email": donor.email,
                "Phone Number": donor.mobile_number
            })
            
        df = pd.DataFrame(data)
        
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Donors')
            
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'Donors_{datetime.now().strftime("%d-%m-%Y")}.xlsx'
        )
    except Exception as e:
        print(f"Export Error: {e}")
        traceback.print_exc()
        return jsonify({"error": "Export failed", "details": str(e)}), 500

@inventory_export_bp.route('/transactions', methods=['GET'])
@jwt_required()
@role_required(['Admin', 'Incharge'])
def export_transactions():
    try:
        from models import Transaction
        
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        status = request.args.get('status')
        
        query = Transaction.query
        
        if start_date:
            try: return_dt = datetime.strptime(start_date, '%d-%m-%Y')
            except: return_dt = None
            if return_dt: query = query.filter(Transaction.issue_date >= return_dt)

        if end_date:
            try: end_dt = datetime.strptime(end_date, '%d-%m-%Y').replace(hour=23, minute=59, second=59)
            except: end_dt = None
            if end_dt: query = query.filter(Transaction.issue_date <= end_dt)
            
        if status and status != 'all':
            query = query.filter(Transaction.status == status)
            
        txs = query.order_by(Transaction.issue_date.desc()).all()
        
        data = []
        for tx in txs:
            data.append({
                "Transaction ID": tx.transaction_id,
                "Item Title": tx.item.title if tx.item else "Unknown",
                "Item ID": tx.inventory_item_id,
                "Accession No": tx.copy.acc_no if tx.copy else "N/A",
                "Borrower Name": tx.borrower.name if tx.borrower else "Unknown",
                "Borrower Roll": tx.borrower.roll_number if tx.borrower else "N/A",
                "Borrower Batch": tx.borrower.batch if tx.borrower else "N/A",
                "Issued On": tx.issue_date.strftime('%d-%m-%Y %H:%M') if tx.issue_date else "",
                "Due Date": tx.due_date.strftime('%d-%m-%Y') if tx.due_date else "",
                "Returned On": tx.return_date.strftime('%d-%m-%Y %H:%M') if tx.return_date else "",
                "Status": tx.status,
                "Fine": tx.fine_accrued,
                "Approved By": tx.approved_by.name if tx.approved_by else "System",
                "Processed By": tx.processed_by.name if tx.processed_by else ""
            })
            
        df = pd.DataFrame(data)
        
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Master Register')
            
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'Checkout_Register_{datetime.now().strftime("%d-%m-%Y")}.xlsx'
        )
    except Exception as e:
        print(f"Export Error: {e}")
        traceback.print_exc()
        return jsonify({"error": "Export failed", "details": str(e)}), 500

@inventory_export_bp.route('/activity', methods=['GET'])
@jwt_required()
@role_required(['Admin', 'Incharge'])
def export_activity():
    try:
        from models.misc import ActivityLog
        
        date_filter = request.args.get('date')
        
        query = ActivityLog.query
        if date_filter:
            try: dt = datetime.strptime(date_filter, '%d-%m-%Y').date()
            except: dt = None
            if dt: query = query.filter(db.func.date(ActivityLog.created_at) == dt)
            
        activities = query.order_by(ActivityLog.created_at.desc()).all()
        
        data = []
        for act in activities:
            user_name = "System"
            if act.user_id:
                u = User.query.get(act.user_id)
                if u: user_name = f"{u.name} ({u.role})"
                
            data.append({
                "Timestamp": act.created_at.strftime('%d-%m-%Y %H:%M:%S') if act.created_at else "",
                "Action": act.action_type,
                "Performed By": user_name,
                "Details": act.details,
            })
            
        df = pd.DataFrame(data)
        
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Activity Log')
            
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'Activity_Log_{datetime.now().strftime("%d-%m-%Y")}.xlsx'
        )
    except Exception as e:
        print(f"Export Error: {e}")
        traceback.print_exc()
        return jsonify({"error": "Export failed", "details": str(e)}), 500

@inventory_export_bp.route('/volunteers/summary', methods=['GET'])
@jwt_required()
@role_required(['Admin', 'Incharge'])
def export_volunteer_summary():
    try:
        from models.misc import AttendanceLog
        
        # Calculate summary per user
        query = db.session.query(
            AttendanceLog.user_id,
            db.func.count(AttendanceLog.id).label('shifts'),
            db.func.sum(AttendanceLog.duration_minutes).label('total_minutes')
        ).filter(AttendanceLog.status == 'APPROVED').group_by(AttendanceLog.user_id).all()
        
        data = []
        for row in query:
            user = User.query.get(row.user_id)
            if not user: continue
            
            total_mins = row.total_minutes or 0
            hours = total_mins / 60
            
            # Format Total Time
            if hours < 0.5:
                total_time_str = f"{int(total_mins)} min"
            else:
                total_time_str = f"{round(hours, 2)} hrs"

            # Format Avg Shift
            avg_mins = (total_mins / row.shifts) if row.shifts > 0 else 0
            avg_hours = avg_mins / 60
            
            if avg_hours < 0.5:
                avg_shift_str = f"{int(avg_mins)} min"
            else:
                avg_shift_str = f"{round(avg_hours, 2)} hrs"
            
            data.append({
                "Volunteer Name": user.name,
                "Major/Dept": user.department.name if user.department else "N/A",
                "Batch": user.batch,
                "Total Shifts": row.shifts,
                "Total Time": total_time_str,
                "Avg Shift Duration": avg_shift_str
            })
            
        df = pd.DataFrame(data)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Volunteer Summary')
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'Volunteer_Summary_{datetime.now().strftime("%d-%m-%Y")}.xlsx'
        )
    except Exception as e:
        print(f"Export Error: {e}")
        traceback.print_exc()
        return jsonify({"error": "Export failed", "details": str(e)}), 500

@inventory_export_bp.route('/volunteers/detailed', methods=['GET'])
@jwt_required()
@role_required(['Admin', 'Incharge'])
def export_volunteer_detailed():
    try:
        from models.misc import AttendanceLog
        
        logs = AttendanceLog.query.order_by(AttendanceLog.date.desc()).all()
        
        data = []
        for log in logs:
            user = log.user
            if not user: continue
            
            data.append({
                "Date": log.date.strftime('%d-%m-%Y') if log.date else "",
                "Volunteer Name": user.name,
                "Role": "Volunteer", # Assumption
                "Department": user.department.name if user.department else "",
                "Check In": log.check_in_time.strftime('%H:%M:%S') if log.check_in_time else "",
                "Check Out": log.check_out_time.strftime('%H:%M:%S') if log.check_out_time else "Active",
                "Duration (mins)": log.duration_minutes or 0,
                "Status": log.status
            })
            
        df = pd.DataFrame(data)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Detailed Attendance')
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'Volunteer_Detailed_{datetime.now().strftime("%d-%m-%Y")}.xlsx'
        )
    except Exception as e:
        print(f"Export Error: {e}")
        traceback.print_exc()
        return jsonify({"error": "Export failed", "details": str(e)}), 500
