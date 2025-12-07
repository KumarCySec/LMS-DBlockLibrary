from app import create_app
from extensions import db
from models import Permission, Role

app = create_app()

def seed_permissions():
    with app.app_context():
        print("Seeding permissions...")
        
        permissions = [
            # Inventory
            {"name": "manage_inventory", "description": "Add, edit, delete items"},
            {"name": "view_inventory", "description": "View inventory items"},
            
            # Transactions
            {"name": "approve_checkout", "description": "Approve checkout requests"},
            {"name": "staff_checkout", "description": "Auto-issue items without approval"},
            {"name": "approve_return", "description": "Process returns"},
            {"name": "approve_renew", "description": "Approve renewal requests"},
            
            # Users
            {"name": "manage_users", "description": "Approve, reject, manage users"},
            {"name": "view_users", "description": "View user list"},
            
            # Admin
            {"name": "manage_settings", "description": "Manage global settings"},
            {"name": "view_analytics", "description": "View analytics dashboard"},
            {"name": "manage_roles", "description": "Manage roles and permissions"},
            {"name": "manage_roster", "description": "Manage duty roster"},
            {"name": "update_library_status", "description": "Open/Close library"},
        ]
        
        for p_data in permissions:
            perm = Permission.query.filter_by(name=p_data['name']).first()
            if not perm:
                perm = Permission(name=p_data['name'], description=p_data['description'])
                db.session.add(perm)
                print(f"Added permission: {p_data['name']}")
            else:
                perm.description = p_data['description']
        
        db.session.commit()
        print("Permissions seeded.")
        
        # Assign default permissions to Admin
        admin_role = Role.query.filter_by(name='Admin').first()
        if admin_role:
            for p in Permission.query.all():
                if p not in admin_role.permissions:
                    admin_role.permissions.append(p)
        
        # Assign staff_checkout and update_library_status to Incharge and Volunteer
        staff_perms = Permission.query.filter(Permission.name.in_(['staff_checkout', 'update_library_status'])).all()
        for role_name in ['Incharge', 'Volunteer']:
            role = Role.query.filter_by(name=role_name).first()
            if role:
                for p in staff_perms:
                    if p not in role.permissions:
                        role.permissions.append(p)
                        print(f"Added {p.name} to {role_name}")

        db.session.commit()
        print("Assigned all permissions.")

if __name__ == '__main__':
    seed_permissions()
