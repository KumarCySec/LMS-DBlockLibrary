from flask import Blueprint, jsonify, request
from extensions import db
from models import User, Transaction, InventoryItem, Department, Donor
from flask_jwt_extended import jwt_required
from utils.decorators import permission_required
from sqlalchemy import func, desc
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/active-checkouts', methods=['GET'])
@jwt_required()
@permission_required('view_analytics')
def get_active_checkouts():
    try:
        count = Transaction.query.filter_by(status='ISSUED').count()
        return jsonify({"active_checkouts": count}), 200
    except Exception as e:
        logger.error(f"Error in active-checkouts: {str(e)}")
        return jsonify({"error": "Failed to fetch active checkouts", "details": str(e)}), 500

@analytics_bp.route('/overdue-count', methods=['GET'])
@jwt_required()
@permission_required('view_analytics')
def get_overdue_count():
    try:
        count = Transaction.query.filter(
            Transaction.status == 'ISSUED', 
            Transaction.due_date < func.now()
        ).count()
        return jsonify({"overdue_count": count}), 200
    except Exception as e:
        logger.error(f"Error in overdue-count: {str(e)}")
        return jsonify({"error": "Failed to fetch overdue count", "details": str(e)}), 500

@analytics_bp.route('/most-borrowed', methods=['GET'])
@jwt_required()
@permission_required('view_analytics')
def get_most_borrowed():
    try:
        limit = request.args.get('limit', 10, type=int)
        results = db.session.query(
            InventoryItem.id,
            InventoryItem.title,
            InventoryItem.type,
            func.count(Transaction.id).label('borrow_count')
        ).join(Transaction).group_by(InventoryItem.id).order_by(desc('borrow_count')).limit(limit).all()
        
        return jsonify([
            {
                "inventory_id": r.id, 
                "title": r.title, 
                "type": r.type, 
                "borrow_count": r.borrow_count
            } for r in results
        ]), 200
    except Exception as e:
        logger.error(f"Error in most-borrowed: {str(e)}")
        return jsonify({"error": "Failed to fetch most borrowed items", "details": str(e)}), 500

@analytics_bp.route('/top-borrowers', methods=['GET'])
@jwt_required()
@permission_required('view_analytics')
def get_top_borrowers():
    try:
        limit = request.args.get('limit', 10, type=int)
        results = db.session.query(
            User.id,
            User.name,
            func.count(Transaction.id).label('borrow_count')
        ).join(Transaction, Transaction.borrower_id == User.id).group_by(User.id).order_by(desc('borrow_count')).limit(limit).all()
        
        return jsonify([
            {
                "user_id": r.id, 
                "name": r.name, 
                "borrow_count": r.borrow_count
            } for r in results
        ]), 200
    except Exception as e:
        logger.error(f"Error in top-borrowers: {str(e)}")
        return jsonify({"error": "Failed to fetch top borrowers", "details": str(e)}), 500

@analytics_bp.route('/department-usage', methods=['GET'])
@jwt_required()
@permission_required('view_analytics')
def get_department_usage():
    try:
        results = db.session.query(
            Department.name,
            func.count(Transaction.id).label('checkout_count')
        ).join(User, User.department_id == Department.id)\
         .join(Transaction, Transaction.borrower_id == User.id)\
         .group_by(Department.id).order_by(desc('checkout_count')).all()
        
        return jsonify([
            {
                "department": r.name, 
                "checkout_count": r.checkout_count
            } for r in results
        ]), 200
    except Exception as e:
        logger.error(f"Error in department-usage: {str(e)}")
        return jsonify({"error": "Failed to fetch department usage", "details": str(e)}), 500

@analytics_bp.route('/donor-stats', methods=['GET'])
@jwt_required()
@permission_required('view_analytics')
def get_donor_stats():
    try:
        limit = request.args.get('limit', 10, type=int)
        results = db.session.query(
            Donor.id,
            Donor.name,
            func.count(InventoryItem.id).label('items_donated')
        ).join(InventoryItem).group_by(Donor.id).order_by(desc('items_donated')).limit(limit).all()
        
        return jsonify([
            {
                "donor_id": r.id, 
                "name": r.name, 
                "items_donated": r.items_donated
            } for r in results
        ]), 200
    except Exception as e:
        logger.error(f"Error in donor-stats: {str(e)}")
        return jsonify({"error": "Failed to fetch donor stats", "details": str(e)}), 500
