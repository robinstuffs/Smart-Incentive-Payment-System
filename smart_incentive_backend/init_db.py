#!/usr/bin/env python
"""Initialize the database with tables, admin users, and test users"""

import os
import sys

# Don't unset DATABASE_URL - use the environment variable for PostgreSQL
# Only unset if you want to force SQLite
# if 'DATABASE_URL' in os.environ:
#     del os.environ['DATABASE_URL']

from app import create_app, db
from app.models import User, SystemSetting

def init_database():
    """Create all tables and add initial data"""
    app = create_app()
    
    with app.app_context():
        # Create all tables
        print("Creating database tables...")
        db.create_all()
        print("✓ Database tables created")
        
        print("\n--- Creating Admin Users ---")
        # Check if admin users already exist
        admin1 = User.query.filter_by(username='admin1').first()
        admin2 = User.query.filter_by(username='admin2').first()
        
        # Create admin1 if not exists
        if not admin1:
            admin1 = User(
                surname='admin',
                firstname='admin',
                middlename='admin',
                username='admin1',
                email='admin1@example.com',
                role='admin'
            )
            admin1.set_password('adminpassword123')
            db.session.add(admin1)
            print("✓ Created admin1 user")
        else:
            print("✓ admin1 user already exists")
        
        # Create admin2 if not exists
        if not admin2:
            admin2 = User(
                surname='admin',
                firstname='admin',
                middlename='admin',
                username='admin2',
                email='admin2@example.com',
                role='admin'
            )
            admin2.set_password('adminpassword456')
            db.session.add(admin2)
            print("✓ Created admin2 user")
        else:
            print("✓ admin2 user already exists")
        
        print("\n--- Creating Test Users ---")
        # Test users to create
        test_users = [
            ('user1','test','test','testuser1', 'testuser1@example.com', 'password123'),
            ('user2','test','test','testuser2', 'testuser2@example.com', 'password123'),
            ('user3','test','test','testuser3', 'testuser3@example.com', 'password123'),
            ('John','Doe','test','john_doe', 'john@example.com', 'password123'),
            ('Smith','jane','test','jane_smith', 'jane@example.com', 'password123'),
            ('robert','Johnson','test','robert_johnson', 'robert@example.com', 'password123'),
            ('Maria','garcia','test','maria_garcia', 'maria@example.com', 'password123'),
            ('David','Brown','test','david_brown', 'david@example.com', 'password123'),
        ]
        
        for surname, firstname, middlename, username, email, password in test_users:
            user = User.query.filter_by(username=username).first()
            if not user:
                user = User(
                    surname=surname,
                    firstname=firstname,
                    middlename=middlename,
                    username=username,
                    email=email,
                    role='user'
                )
                user.set_password(password)
                db.session.add(user)
                print(f"✓ Created user: {username}")
            else:
                print(f"✓ User already exists: {username}")
        
        print("\n--- Creating System Settings ---")
        # Create system settings if not exist
        settings_to_create = [
            ('max_applications_per_user', '3', 'Maximum number of applications per user'),
            ('incentive_amount', '100.00', 'Default incentive amount for eligible users'),
            ('application_period_enabled', 'true', 'Whether application submission is enabled'),
        ]
        
        for key, value, description in settings_to_create:
            setting = SystemSetting.query.filter_by(key=key).first()
            if not setting:
                setting = SystemSetting(key=key, value=value, description=description)
                db.session.add(setting)
                print(f"✓ Created system setting: {key}")
            else:
                print(f"✓ System setting already exists: {key}")
        
        # Commit all changes
        db.session.commit()
        
        print("\n" + "="*50)
        print("✓ Database initialization complete!")
        print("="*50)
        print("\n📋 ADMIN CREDENTIALS:")
        print("  • admin1: admin1@example.com / adminpassword123")
        print("  • admin2: admin2@example.com / adminpassword456")
        print("\n👥 TEST USER CREDENTIALS:")
        # for surname, firstname, middlename, username, email, password in test_users:
            # print(f"  • {username}: {email} / {password}")
        print("\n⚙️  SYSTEM SETTINGS:")
        print("  • max_applications_per_user: 3")
        print("  • incentive_amount: 100.00")
        print("  • application_period_enabled: true")

if __name__ == '__main__':
    try:
        init_database()
    except Exception as e:
        print(f"✗ Error initializing database: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
