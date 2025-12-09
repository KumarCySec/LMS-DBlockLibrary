import os
from datetime import timedelta


class Config:
    # Load from env in production; use obvious weak defaults ONLY for local dev
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-prod")

    # Build a proper SQLAlchemy URI
    _db_path = os.environ.get("DB_PATH")
    if _db_path:
        # Treat DB_PATH as a filesystem path and convert to sqlite URL
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{_db_path}"
    else:
        # Fall back to DATABASE_URL if set (e.g. Postgres on Render)
        # or local sqlite file in instance/
        SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL") or "sqlite:///instance/lms.db"

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-key-change-in-prod")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)
