from extensions import db
from models import Notification, User, Role
from datetime import datetime

def send_notification(user_id, type, title, body, related_transaction_id=None):
    """Send a notification to a specific user."""
    try:
        notif = Notification(
            user_id=user_id,
            type=type,
            title=title,
            body=body,
            related_transaction_id=related_transaction_id,
            created_at=datetime.utcnow()
        )
        db.session.add(notif)
        db.session.commit()
        return True
    except Exception as e:
        print(f"Error sending notification: {e}")
        db.session.rollback()
        return False

def notify_roles(role_names, type, title, body, related_transaction_id=None):
    """Send a notification to all users with specific roles."""
    try:
        # Find all users who have any of the specified roles
        users = User.query.join(User.roles).filter(Role.name.in_(role_names)).all()
        
        notifications = []
        for user in users:
            notif = Notification(
                user_id=user.id,
                type=type,
                title=title,
                body=body,
                related_transaction_id=related_transaction_id,
                created_at=datetime.utcnow()
            )
            notifications.append(notif)
        
        if notifications:
            db.session.add_all(notifications)
            db.session.commit()
        return True
    except Exception as e:
        print(f"Error notifying roles: {e}")
        db.session.rollback()
        return False
