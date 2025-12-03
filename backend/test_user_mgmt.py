from app import create_app
from extensions import db
from models import User, Role, Department
from flask_jwt_extended import create_access_token

app = create_app()

def test_user_mgmt():
    with app.app_context():
        # Create a test admin token
        admin_role = Role.query.filter_by(name='Admin').first()
        if not admin_role:
            print("Error: Admin role not found.")
            return

        admin_user = User.query.join(User.roles).filter(Role.name == 'Admin').first()
        if not admin_user:
            print("Error: No admin user found.")
            return

        token = create_access_token(identity=str(admin_user.id))
        headers = {'Authorization': f'Bearer {token}'}
        client = app.test_client()

        print(f"Testing User Management with Admin: {admin_user.name}")

        # 1. Test List Users with Filters
        print("Testing list_users with filters...", end=' ')
        res = client.get('/api/users/?status=approved&limit=5', headers=headers)
        if res.status_code == 200:
            print("OK")
        else:
            print(f"FAILED ({res.status_code})")
            print(res.json)

        # 2. Test Get User Detail (Existing)
        print(f"Testing get_user_detail for ID {admin_user.id}...", end=' ')
        res = client.get(f'/api/users/{admin_user.id}', headers=headers)
        if res.status_code == 200:
            data = res.json
            if 'current_checkouts' in data and 'past_transactions' in data:
                print("OK (Structure Valid)")
            else:
                print("FAILED (Missing fields)")
                print(data.keys())
        else:
            print(f"FAILED ({res.status_code})")
            print(res.json)

        # 3. Test Get User Detail (Non-existent)
        print("Testing get_user_detail for ID 99999...", end=' ')
        res = client.get('/api/users/99999', headers=headers)
        if res.status_code == 404:
            print("OK (404 Returned)")
        else:
            print(f"FAILED ({res.status_code})")

if __name__ == '__main__':
    test_user_mgmt()
