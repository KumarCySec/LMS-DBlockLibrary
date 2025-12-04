from app import create_app
from models import User, Role

app = create_app()

with app.app_context():
    admin_role = Role.query.filter_by(name='Admin').first()
    if admin_role:
        admin_user = User.query.filter(User.roles.contains(admin_role)).first()
        if admin_user:
            with open('admin_email.txt', 'w') as f:
                f.write(admin_user.email)
