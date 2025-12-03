from extensions import scheduler, db
from models import Transaction, Notification, AppSetting, InventoryItem
from datetime import datetime, timedelta

def check_due_items():
    """Find items due tomorrow and notify users."""
    print("Running check_due_items job...")
    with scheduler.app.app_context():
        tomorrow = datetime.utcnow().date() + timedelta(days=1)
        
        # Find transactions due tomorrow (ignoring time for simplicity, or check range)
        # Here we check if due_date is between tomorrow 00:00 and tomorrow 23:59
        start = datetime.combine(tomorrow, datetime.min.time())
        end = datetime.combine(tomorrow, datetime.max.time())
        
        due_txs = Transaction.query.filter(
            Transaction.status == 'ISSUED',
            Transaction.due_date >= start,
            Transaction.due_date <= end
        ).all()
        
        for tx in due_txs:
            # Check if notification already exists to avoid duplicates
            exists = Notification.query.filter_by(
                user_id=tx.borrower_id, 
                related_transaction_id=tx.id,
                type='due_soon'
            ).first()
            
            if not exists:
                notif = Notification(
                    user_id=tx.borrower_id,
                    type='due_soon',
                    title='Item Due Soon',
                    body=f'Your borrowed item "{tx.item.title}" is due tomorrow ({tx.due_date.strftime("%Y-%m-%d")}).',
                    related_transaction_id=tx.id
                )
                db.session.add(notif)
        
        db.session.commit()

def check_overdue_items():
    """Mark overdue items and calculate fines."""
    print("Running check_overdue_items job...")
    with scheduler.app.app_context():
        now = datetime.utcnow()
        
        # Find ISSUED items past due date
        overdue_txs = Transaction.query.filter(
            Transaction.status == 'ISSUED',
            Transaction.due_date < now
        ).all()
        
        fine_setting = AppSetting.query.get('fine_per_day')
        rate = float(fine_setting.value) if fine_setting else 10.0
        
        for tx in overdue_txs:
            # We don't change status to OVERDUE automatically if we want to keep it ISSUED until returned?
            # Or we can have a separate status. The plan said status: OVERDUE.
            # Let's update status to OVERDUE if not already.
            
            if tx.status != 'OVERDUE':
                tx.status = 'OVERDUE'
                
                # Notify
                notif = Notification(
                    user_id=tx.borrower_id,
                    type='overdue',
                    title='Item Overdue',
                    body=f'Your borrowed item "{tx.item.title}" is overdue. Please return it to avoid further fines.',
                    related_transaction_id=tx.id
                )
                db.session.add(notif)
            
            # Update fine
            overdue_days = (now - tx.due_date).days
            if overdue_days > 0:
                tx.fine_accrued = overdue_days * rate
                
        db.session.commit()

def init_scheduler(app):
    # Add jobs
    # 'interval' or 'cron'. 'cron' is better for daily jobs.
    # For demo/testing, maybe run every minute? No, let's stick to daily but allow manual trigger.
    
    # Run every day at 8 AM
    scheduler.add_job(check_due_items, 'cron', hour=8, minute=0, id='check_due_items')
    
    # Run every day at 1 AM
    scheduler.add_job(check_overdue_items, 'cron', hour=1, minute=0, id='check_overdue_items')
    
    # Store app in scheduler for context
    scheduler.app = app
