from app import create_app, db
from models import Role, Permission

app = create_app()

with app.app_context():
    incharge = Role.query.filter_by(name='Incharge').first()
    volunteer = Role.query.filter_by(name='Volunteer').first()
    
    approve_checkout = Permission.query.filter_by(name='approve_checkout').first()
    manage_inventory = Permission.query.filter_by(name='manage_inventory').first()
    
    if not approve_checkout:
        print("Permission 'approve_checkout' not found!")
    if not manage_inventory:
        print("Permission 'manage_inventory' not found!")
        
    if incharge:
        if approve_checkout and approve_checkout not in incharge.permissions:
            incharge.permissions.append(approve_checkout)
            print("Added 'approve_checkout' to Incharge")
        if manage_inventory and manage_inventory not in incharge.permissions:
            incharge.permissions.append(manage_inventory)
            print("Added 'manage_inventory' to Incharge")
            
    if volunteer:
        if approve_checkout and approve_checkout not in volunteer.permissions:
            volunteer.permissions.append(approve_checkout)
            print("Added 'approve_checkout' to Volunteer")
        if manage_inventory and manage_inventory not in volunteer.permissions:
            volunteer.permissions.append(manage_inventory)
            print("Added 'manage_inventory' to Volunteer")
            
    db.session.commit()
    print("Permissions updated.")
