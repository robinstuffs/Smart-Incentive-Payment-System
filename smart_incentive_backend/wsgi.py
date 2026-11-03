"""
WSGI entry point for production deployment (Gunicorn on Render)

Usage:
    gunicorn wsgi:app

Environment variables required:
    - DATABASE_URL: PostgreSQL connection string
    - FLASK_ENV: Set to 'production'
    - SECRET_KEY: Secret key for Flask
    - JWT_SECRET_KEY: Secret key for JWT tokens
"""

from app import create_app, db

app = create_app()

if __name__ == "__main__":
    app.run()
