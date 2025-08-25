from flask import Flask, current_app, render_template
from flask_sqlalchemy import SQLAlchemy
from os import path
import os
from flask_login import LoginManager
from datetime import timedelta
from flask_migrate import Migrate
from flask_wtf import CSRFProtect
from logging.handlers import RotatingFileHandler
import logging
from .config import get_config

db = SQLAlchemy()
migrate = Migrate()
csrf = CSRFProtect()

def create_app():
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(get_config())
    app.permanent_session_lifetime = timedelta(minutes=30)
    os.makedirs(os.path.join(app.instance_path), exist_ok=True)

    db.init_app(app)
    migrate.init_app(app, db)
    csrf.init_app(app)

    # Logging setup
    log_dir = os.path.join(app.instance_path, 'logs')
    os.makedirs(log_dir, exist_ok=True)
    file_handler = RotatingFileHandler(os.path.join(log_dir, 'app.log'), maxBytes=1_000_000, backupCount=5)
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'))
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)

    from .veiws import views
    from .auth import auth  
    from .lib import lib
    from .stu import stu
    from .MA import MA

    app.register_blueprint(views, url_prefix='/')
    app.register_blueprint(auth, url_prefix='/')
    app.register_blueprint(lib, url_prefix='/lib')
    app.register_blueprint(stu, url_prefix='/stu')
    app.register_blueprint(MA, url_prefix='/MasterAdmin')

    from .models import User

    with app.app_context():
        create_database()

    logman = LoginManager()
    logman.login_view = 'auth.auth_page'
    logman.init_app(app)

    @logman.user_loader
    def load_user(id):
        return User.query.get(int(id))

    # Make current_user available in all templates as `current_user`
    @app.context_processor
    def inject_current_user():
        try:
            from flask_login import current_user
            return dict(current_user=current_user)
        except Exception:
            return dict(current_user=None)

    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return render_template('error.html', error_message='Page not found'), 404

    @app.errorhandler(500)
    def server_error(e):
        current_app.logger.exception("Unhandled exception")
        return render_template('error.html', error_message='An internal error occurred'), 500

    return app

def create_database():
    try:
        with current_app.app_context():
            db.create_all()
            current_app.logger.info('Ensured database tables exist')
    except Exception as e:
        current_app.logger.exception('An error occurred while creating the database')
