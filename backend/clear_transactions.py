from app import create_app, db
from models import Transaction, Waitlist, InventoryCopy, InventoryItem, Notification

app = create_app()

with app.app_context():
    print("Clearing all transactions...")
    Transaction.query.delete()
    
    print("Clearing waitlist...")
    Waitlist.query.delete()
    
    print("Clearing notifications...")
    Notification.query.delete()
    
    print("Resetting inventory status...")
    # Reset all copies to AVAILABLE
    InventoryCopy.query.update({InventoryCopy.status: 'AVAILABLE'})
    
    # Reset all items available quantity to total quantity
    # This is a bit more complex if we want to be precise, but assuming all copies are now available:
    items = InventoryItem.query.all()
    for item in items:
        item.quantity_available = item.quantity_total
        
    db.session.commit()
    print("All transactions cleared and inventory reset.")
