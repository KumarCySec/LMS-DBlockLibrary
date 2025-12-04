from app import create_app, db
from models import Role, Permission

app = create_app()

with app.app_context():
    incharge = Role.query.filter_by(name='Incharge').first()
    perm = Permission.query.filter_by(name='manage_donors').first()
    
    if not perm:
        print("Creating 'manage_donors' permission...")
        perm = Permission(name='manage_donors', description='Manage donors')
        db.session.add(perm)
    
    if incharge:
        if perm not in incharge.permissions:
            incharge.permissions.append(perm)
            print("Added 'manage_donors' to Incharge")
        else:
            print("'manage_donors' already in Incharge")
            
    db.session.commit()
    print("Done.")
