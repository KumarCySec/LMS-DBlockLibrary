import os
from datetime import timedelta


class Config:
    # Load from env in production; use obvious weak defaults ONLY for local dev
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-prod")

    # Absolute-safe SQLite DB path (works on Windows, Linux, PythonAnywhere)
    _db_path = os.environ.get("DB_PATH")

    if not _db_path:
        # Build absolute path to backend/instance/lms.db
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        _db_path = os.path.join(BASE_DIR, "instance", "lms.db")

    # DATABASE_URL (Postgres etc.) still takes priority if set
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL") or f"sqlite:///{_db_path}"

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-key-change-in-prod")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)
