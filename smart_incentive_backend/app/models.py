from app import db
from datetime import datetime
from flask_bcrypt import generate_password_hash, check_password_hash

class Bank(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False, unique=True)
    abbreviation = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Bank {self.abbreviation}>"

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    surname = db.Column(db.String(120), index=True, nullable=False)
    firstname = db.Column(db.String(120), index=True, nullable=False)
    middlename = db.Column(db.String(120), index=True)
    username = db.Column(db.String(64), index=True, unique=True, nullable=False)
    email = db.Column(db.String(120), index=True, unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(10), default="user") # "user" or "admin"
    is_blocked = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Extended profile fields
    phone_number = db.Column(db.String(20))
    street_address = db.Column(db.String(255))
    area_district = db.Column(db.String(120))
    city = db.Column(db.String(120))
    lga = db.Column(db.String(120))
    state = db.Column(db.String(120))
    country = db.Column(db.String(100), default="Nigeria")
    postal_code = db.Column(db.String(20))

    # Payment / bank account details
    account_name = db.Column(db.String(200))
    account_number = db.Column(db.String(20))
    bank_id = db.Column(db.Integer, db.ForeignKey("bank.id"), nullable=True)
    bank = db.relationship("Bank", backref="users")

    applications = db.relationship("Application", backref="applicant", lazy="dynamic")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password).decode("utf-8")

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def is_profile_complete(self):
        """Check if required profile fields are filled."""
        required = [
            self.phone_number,
            self.street_address,
            self.city,
            self.lga,
            self.state,
            self.country,
        ]
        return all(bool(f and f.strip()) for f in required)

    def __repr__(self):
        return f"<User {self.username}>"

class Application(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    
    # ML model features (12 fields)
    age = db.Column(db.Integer, nullable=False)
    income = db.Column(db.Float, nullable=False)
    employment_status = db.Column(db.String(50), nullable=False)  # Employed/Unemployed
    housing_status = db.Column(db.String(50), nullable=False)  # Owned/Rented/Homeless
    health_status = db.Column(db.String(50), nullable=False)  # Good/Fair/Poor
    disability = db.Column(db.String(10), nullable=False)  # Yes/No
    chronic_illness = db.Column(db.String(10), nullable=False)  # Yes/No
    caregiver = db.Column(db.String(10), nullable=False)  # Yes/No
    family_support = db.Column(db.String(50), nullable=False)  # Low/Medium/High
    healthcare_access = db.Column(db.String(50), nullable=False)  # Easy/Difficult
    national_id = db.Column(db.String(10), nullable=False)  # Yes/No
    location = db.Column(db.String(50), nullable=False)  # Urban/Rural

    submission_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default="pending")  # pending, approved, rejected
    ml_prediction = db.Column(db.String(20))  # "Eligible" or "Not Eligible"
    ml_probability = db.Column(db.Float)  # Probability score from model
    ml_confidence = db.Column(db.String(20))  # High/Medium/Low
    admin_notes = db.Column(db.Text)

    payment = db.relationship("Payment", backref="application", uselist=False)

    def __repr__(self):
        return f"<Application {self.id} by User {self.user_id}>"

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey("application.id"), unique=True, nullable=False)
    transaction_id = db.Column(db.String(100), unique=True, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    payment_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default="completed") # completed, failed, refunded

    # Snapshot of account details at time of payment
    account_name = db.Column(db.String(200))
    account_number = db.Column(db.String(20))
    bank_name = db.Column(db.String(150))
    bank_abbreviation = db.Column(db.String(20))

    def __repr__(self):
        return f"<Payment {self.transaction_id} for Application {self.application_id}>"

class SystemSetting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(50), unique=True, nullable=False)
    value = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)

    def __repr__(self):
        return f"<SystemSetting {self.key}: {self.value}>"
