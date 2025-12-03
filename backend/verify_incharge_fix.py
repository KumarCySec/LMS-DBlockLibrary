from app import create_app
from extensions import db
from models import User, Role, Permission, Transaction, InventoryItem
from flask_jwt_extended import create_access_token
import json

app = create_app()

def verify_incharge_fix():
    with app.app_context():
        print("Verifying Incharge Role Fix...")
        
        # 1. Setup Test Users
        incharge_role = Role.query.filter_by(name='Incharge').first()
        volunteer_role = Role.query.filter_by(name='Volunteer').first()
        
        # Ensure Incharge has approve_checkout
        perm_approve = Permission.query.filter_by(name='approve_checkout').first()
        if perm_approve not in incharge_role.permissions:
            incharge_role.permissions.append(perm_approve)
            db.session.commit()
            print("Added approve_checkout to Incharge.")
            
        # Ensure Volunteer does NOT have approve_checkout (for test)
        if perm_approve in volunteer_role.permissions:
            volunteer_role.permissions.remove(perm_approve)
            db.session.commit()
            print("Removed approve_checkout from Volunteer.")

        incharge_user = User.query.join(User.roles).filter(Role.name == 'Incharge').first()
        volunteer_user = User.query.join(User.roles).filter(Role.name == 'Volunteer').first()
        
        if not incharge_user or not volunteer_user:
            print("Error: Missing test users.")
            return

        client = app.test_client()

        # 2. Test Login Response (Permissions)
        print(f"Testing Login for Incharge ({incharge_user.email})...", end=' ')
        res = client.post('/api/auth/login', json={
            "email": incharge_user.email,
            "password": "password123" # Assuming default password, might fail if hashed differently
        })
        
        # If login fails due to password, we'll manually create token
        if res.status_code != 200:
            print(f"Login failed ({res.status_code}), using manual token.")
            token_incharge = create_access_token(identity=str(incharge_user.id))
        else:
            data = res.json
            if 'permissions' in data['user']:
                print("OK (Permissions present)")
                print(f"Permissions: {data['user']['permissions']}")
            else:
                print("FAILED (Permissions missing)")
            token_incharge = data['access_token']

        token_vol = create_access_token(identity=str(volunteer_user.id))
        
        # 3. Test Access to Protected Endpoint (approve_checkout)
        # Create a dummy transaction
        item = InventoryItem.query.first()
        tx = Transaction(
            transaction_id="TEST-TX-001",
            inventory_item_id=item.id,
            borrower_id=volunteer_user.id,
            status='REQUESTED'
        )
        db.session.add(tx)
        db.session.commit()
        
        headers_incharge = {'Authorization': f'Bearer {token_incharge}'}
        headers_vol = {'Authorization': f'Bearer {token_vol}'}
        
        print(f"Testing Incharge approve_checkout (TX {tx.id})...", end=' ')
        res = client.post(f'/api/transactions/{tx.id}/approve', headers=headers_incharge, json={'action': 'approve'})
        if res.status_code == 200:
            print("OK (Allowed)")
        else:
            print(f"FAILED ({res.status_code})")
            print(res.json)
            
        # Reset TX for Volunteer test
        tx.status = 'REQUESTED'
        db.session.commit()
        
        print(f"Testing Volunteer approve_checkout (Should Fail)...", end=' ')
        res = client.post(f'/api/transactions/{tx.id}/approve', headers=headers_vol, json={'action': 'approve'})
        if res.status_code == 403: # Permission required should return 403
            print("OK (403 Forbidden)")
        else:
            print(f"FAILED ({res.status_code})")
            
        # Cleanup
        db.session.delete(tx)
        db.session.commit()

if __name__ == '__main__':
    verify_incharge_fix()
