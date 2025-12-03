from app import create_app
from extensions import db
from models import User, Role
from flask_jwt_extended import create_access_token

app = create_app()

def test_analytics():
    with app.app_context():
        # Create a test admin token
        admin_role = Role.query.filter_by(name='Admin').first()
        if not admin_role:
            print("Error: Admin role not found. Run seed_users.py first.")
            return

        admin_user = User.query.join(User.roles).filter(Role.name == 'Admin').first()
        if not admin_user:
            print("Error: No admin user found. Run seed_users.py first.")
            return

        token = create_access_token(identity=str(admin_user.id))
        headers = {'Authorization': f'Bearer {token}'}
        client = app.test_client()

        endpoints = [
            '/api/analytics/active-checkouts',
            '/api/analytics/overdue-count',
            '/api/analytics/most-borrowed',
            '/api/analytics/top-borrowers',
            '/api/analytics/department-usage',
            '/api/analytics/donor-stats'
        ]

        print(f"Testing analytics with Admin user: {admin_user.name} (ID: {admin_user.id})")

        for endpoint in endpoints:
            print(f"Testing {endpoint}...", end=' ')
            res = client.get(endpoint, headers=headers)
            if res.status_code == 200:
                print("OK")
                # print(res.json)
            else:
                print(f"FAILED ({res.status_code})")
                print(res.json)

if __name__ == '__main__':
    test_analytics()
