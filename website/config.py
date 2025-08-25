import os


class BaseConfig:
    SECRET_KEY = os.environ.get("SECRET_KEY", "change-this-in-prod")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(os.getcwd(), 'instance', 'Kishorebase.db')}",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    WTF_CSRF_TIME_LIMIT = 60 * 60 * 24
    WTF_CSRF_ENABLED = True

    # File uploads
    UPLOAD_FOLDER = os.path.join("static", "uploads", "pfp")
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}
    MAX_CONTENT_LENGTH = 2 * 1024 * 1024

    # Rate limit defaults (requires Flask-Limiter)
    RATELIMIT_DEFAULT = os.environ.get("RATELIMIT_DEFAULT", "200 per hour")
    RATELIMIT_STORAGE_URI = os.environ.get("RATELIMIT_STORAGE_URI", "memory://")


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    ENV = "development"
    SESSION_COOKIE_SECURE = False


class ProductionConfig(BaseConfig):
    DEBUG = False
    ENV = "production"
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_SAMESITE = "Lax"


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}


def get_config():
    name = os.environ.get("FLASK_ENV", "development").lower()
    return config_by_name.get(name, DevelopmentConfig)

