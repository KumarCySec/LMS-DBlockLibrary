import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-prod'
    if not SECRET_KEY:
         # Fallback for local dev if .env not loaded yet, or ensure .env is loaded in app.py
         # For now, let's allow a fallback BUT warn? Or just rely on .env being loaded.
         pass 

    # Database: Use DB_PATH if strictly provided (Render Persistent Disk), else DATABASE_URL, else local sqlite
    SQLALCHEMY_DATABASE_URI = os.environ.get('DB_PATH') or os.environ.get('DATABASE_URL') or 'sqlite:///lms.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-prod'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)
