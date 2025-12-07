from flask import Flask
from config import Config
from extensions import db, migrate, jwt, scheduler
import models # Ensure models are imported for migration detection
from dotenv import load_dotenv
import os

# Load env variables (for local dev)
load_dotenv()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Enable CORS
    from flask_cors import CORS
    # Allow Frontend URL from env or default to *
    frontend_url = os.environ.get('FRONTEND_URL', '*')
    CORS(app, resources={r"/api/*": {"origins": frontend_url}}, supports_credentials=True)

    
    # Initialize scheduler
    if not scheduler.running:
        from jobs.scheduler import init_scheduler
        init_scheduler(app)
        scheduler.start()

    # Register Blueprints
    from routes import auth_bp, users_bp, inventory_bp, transactions_bp, admin_bp, common_bp
    from routes.analytics import analytics_bp
    from routes.import_routes import import_bp
    from routes.inventory_export import inventory_export_bp
    from routes.roster import roster_bp
    from routes.attendance import attendance_bp
    from routes.announcements import announcements_bp
    from routes.activity import activity_bp
    from routes.payments import payments_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(inventory_bp, url_prefix='/api/inventory')
    app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(common_bp, url_prefix='/api/common')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(import_bp, url_prefix='/api/import')
    app.register_blueprint(inventory_export_bp, url_prefix='/api/export')
    app.register_blueprint(roster_bp, url_prefix='/api/roster')
    app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
    app.register_blueprint(announcements_bp, url_prefix='/api/announcements')
    app.register_blueprint(activity_bp, url_prefix='/api/activity')
    app.register_blueprint(payments_bp, url_prefix='/api/payments')

    @app.route('/')
    def index():
        return {"message": "D-Block Library LMS API is running"}

    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5176))
    app.run(debug=True, host='0.0.0.0', port=port)
