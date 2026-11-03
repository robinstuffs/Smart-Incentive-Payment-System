from app.user import bp
from app.models import User, Application, SystemSetting, Payment, Bank
from app import db
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.decorators import admin_required
from app.ml_service import MLService
import uuid

def _user_profile_dict(user):
    bank_info = None
    if user.bank:
        bank_info = {"id": user.bank.id, "name": user.bank.name, "abbreviation": user.bank.abbreviation}
    return {
        "id": user.id,
        "surname": user.surname,
        "firstname": user.firstname,
        "middlename": user.middlename,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "is_blocked": user.is_blocked,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        # Extended profile
        "phone_number": user.phone_number,
        "street_address": user.street_address,
        "area_district": user.area_district,
        "city": user.city,
        "lga": user.lga,
        "state": user.state,
        "country": user.country or "Nigeria",
        "postal_code": user.postal_code,
        # Payment details
        "account_name": user.account_name,
        "account_number": user.account_number,
        "bank_id": user.bank_id,
        "bank": bank_info,
        "is_profile_complete": user.is_profile_complete(),
    }

@bp.route("/profile", methods=["GET"])
@jwt_required()
def get_user_profile():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    return jsonify(_user_profile_dict(user)), 200

@bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_user_profile():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json()

    # Basic personal info
    if "surname" in data:
        user.surname = data["surname"]
    if "firstname" in data:
        user.firstname = data["firstname"]
    if "middlename" in data:
        user.middlename = data["middlename"]
    if "email" in data:
        new_email = data["email"]
        if not isinstance(new_email, str) or "@" not in new_email or "." not in new_email:
            return jsonify({"message": "Invalid email format"}), 400
        if User.query.filter_by(email=new_email).first() and new_email != user.email:
            return jsonify({"message": "Email already registered"}), 409
        user.email = new_email

    # Extended profile
    if "phone_number" in data:
        user.phone_number = data["phone_number"]
    if "street_address" in data:
        user.street_address = data["street_address"]
    if "area_district" in data:
        user.area_district = data["area_district"]
    if "city" in data:
        user.city = data["city"]
    if "lga" in data:
        user.lga = data["lga"]
    if "state" in data:
        user.state = data["state"]
    if "country" in data:
        user.country = data["country"]
    if "postal_code" in data:
        user.postal_code = data["postal_code"]

    db.session.commit()
    return jsonify({"message": "Profile updated successfully", "is_profile_complete": user.is_profile_complete()}), 200

@bp.route("/profile/payment-details", methods=["PUT"])
@jwt_required()
def update_payment_details():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json()
    account_name = data.get("account_name", "").strip()
    account_number = data.get("account_number", "").strip()
    bank_id = data.get("bank_id")

    if not account_name:
        return jsonify({"message": "Account name is required"}), 400
    if not account_number:
        return jsonify({"message": "Account number is required"}), 400
    if not bank_id:
        return jsonify({"message": "Bank is required"}), 400

    bank = Bank.query.get(bank_id)
    if not bank:
        return jsonify({"message": "Invalid bank selected"}), 400

    user.account_name = account_name
    user.account_number = account_number
    user.bank_id = bank_id
    db.session.commit()

    return jsonify({
        "message": "Payment details saved successfully",
        "account_name": user.account_name,
        "account_number": user.account_number,
        "bank_id": user.bank_id,
        "bank": {"id": bank.id, "name": bank.name, "abbreviation": bank.abbreviation},
    }), 200

@bp.route("/applications", methods=["POST"])
@jwt_required()
def submit_application():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    if user.is_blocked:
        return jsonify({"message": "Your account is blocked. Cannot submit application."}), 403

    # Enforce profile completion
    if not user.is_profile_complete():
        return jsonify({"message": "Your profile is incomplete. Please complete your profile before applying.", "profile_incomplete": True}), 403

    # Check if application period is enabled
    application_period_enabled = SystemSetting.query.filter_by(key="application_period_enabled").first()
    if application_period_enabled and application_period_enabled.value.lower() != "true":
        return jsonify({"message": "Application submission is currently closed."}), 403

    # Check application limits
    max_applications_setting = SystemSetting.query.filter_by(key="max_applications_per_user").first()
    if max_applications_setting:
        max_applications = int(max_applications_setting.value)
        current_applications_count = Application.query.filter_by(user_id=current_user_id).count()
        if current_applications_count >= max_applications:
            return jsonify({"message": f"You have reached the maximum limit of {max_applications} applications."}), 403

    data = request.get_json()
    
    required_fields = [
        'age', 'income', 'employment_status', 'housing_status', 
        'health_status', 'disability', 'chronic_illness', 'caregiver',
        'family_support', 'healthcare_access', 'national_id', 'location'
    ]
    
    for field in required_fields:
        if field not in data:
            return jsonify({"message": f"Missing required field: {field}"}), 400

    try:
        age = int(data.get("age"))
        income = float(data.get("income"))
        
        if age < 60:
            return jsonify({"message": "Applicant must be at least 60 years old"}), 400
        if income < 0:
            return jsonify({"message": "Income cannot be negative"}), 400
            
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid data types for age or income"}), 400

    ml_input_data = {
        "age": age,
        "income": income,
        "employment_status": data.get("employment_status"),
        "housing_status": data.get("housing_status"),
        "health_status": data.get("health_status"),
        "disability": data.get("disability"),
        "chronic_illness": data.get("chronic_illness"),
        "caregiver": data.get("caregiver"),
        "family_support": data.get("family_support"),
        "healthcare_access": data.get("healthcare_access"),
        "national_id": data.get("national_id"),
        "location": data.get("location")
    }

    try:
        preprocessed_data = MLService.preprocess_input(ml_input_data)
        ml_prediction = MLService.predict_eligibility(preprocessed_data)
        
        ml_probability = None
        ml_confidence = "Medium"
        
        if hasattr(MLService._model, 'predict_proba'):
            proba = MLService._model.predict_proba(preprocessed_data)[0]
            ml_probability = float(proba[1])
            
            if abs(ml_probability - 0.5) > 0.3:
                ml_confidence = "High"
            else:
                ml_confidence = "Medium"
        
        ml_prediction_str = "Eligible" if ml_prediction == 1 else "Not Eligible"
        
    except Exception as e:
        return jsonify({"message": f"Error processing application: {str(e)}"}), 500

    new_application = Application(
        user_id=current_user_id,
        age=age,
        income=income,
        employment_status=data.get("employment_status"),
        housing_status=data.get("housing_status"),
        health_status=data.get("health_status"),
        disability=data.get("disability"),
        chronic_illness=data.get("chronic_illness"),
        caregiver=data.get("caregiver"),
        family_support=data.get("family_support"),
        healthcare_access=data.get("healthcare_access"),
        national_id=data.get("national_id"),
        location=data.get("location"),
        ml_prediction=ml_prediction_str,
        ml_probability=ml_probability,
        ml_confidence=ml_confidence,
        status="approved" if ml_prediction == 1 else "rejected"
    )
    
    db.session.add(new_application)
    db.session.commit()

    return jsonify({
        "message": "Application submitted successfully",
        "application_id": new_application.id,
        "ml_prediction": ml_prediction_str,
        "probability": ml_probability,
        "confidence": ml_confidence
    }), 201

@bp.route("/applications", methods=["GET"])
@jwt_required()
def get_user_applications():
    current_user_id = int(get_jwt_identity())
    applications = Application.query.filter_by(user_id=current_user_id).all()
    result = []
    for app in applications:
        payment_status = app.payment.status if app.payment else "pending"
        payment_info = None
        if app.payment:
            payment_info = {
                "transaction_id": app.payment.transaction_id,
                "amount": app.payment.amount,
                "payment_date": app.payment.payment_date.isoformat(),
                "status": app.payment.status,
                "account_name": app.payment.account_name,
                "account_number": app.payment.account_number,
                "bank_name": app.payment.bank_name,
                "bank_abbreviation": app.payment.bank_abbreviation,
            }
        result.append({
            "id": app.id,
            "submission_date": app.submission_date.isoformat(),
            "status": app.status,
            "ml_prediction": app.ml_prediction,
            "payment_status": payment_status,
            "amount": app.payment.amount if app.payment else None,
            "payment": payment_info,
        })
    return jsonify(result), 200

@bp.route("/applications/<int:application_id>/result", methods=["GET"])
@jwt_required()
def get_application_result(application_id):
    current_user_id = int(get_jwt_identity())
    application = Application.query.filter_by(id=application_id, user_id=current_user_id).first()
    if not application:
        return jsonify({"message": "Application not found or you don't have permission"}), 404

    return jsonify({
        "application_id": application.id,
        "ml_prediction": application.ml_prediction,
        "probability": application.ml_probability,
        "confidence": application.ml_confidence,
        "status": application.status,
        "submission_date": application.submission_date.isoformat()
    }), 200

@bp.route("/applications/<int:application_id>", methods=["GET"])
@jwt_required()
def get_single_application(application_id):
    current_user_id = int(get_jwt_identity())
    application = Application.query.filter_by(id=application_id, user_id=current_user_id).first()
    if not application:
        return jsonify({"message": "Application not found or you don't have permission"}), 404

    payment_info = None
    if application.payment:
        payment_info = {
            "transaction_id": application.payment.transaction_id,
            "amount": application.payment.amount,
            "payment_date": application.payment.payment_date.isoformat(),
            "status": application.payment.status,
            "account_name": application.payment.account_name,
            "account_number": application.payment.account_number,
            "bank_name": application.payment.bank_name,
            "bank_abbreviation": application.payment.bank_abbreviation,
        }

    return jsonify({
        "id": application.id,
        "age": application.age,
        "income": application.income,
        "employment_status": application.employment_status,
        "housing_status": application.housing_status,
        "health_status": application.health_status,
        "disability": application.disability,
        "chronic_illness": application.chronic_illness,
        "caregiver": application.caregiver,
        "family_support": application.family_support,
        "healthcare_access": application.healthcare_access,
        "national_id": application.national_id,
        "location": application.location,
        "submission_date": application.submission_date.isoformat(),
        "status": application.status,
        "ml_prediction": application.ml_prediction,
        "ml_probability": application.ml_probability,
        "ml_confidence": application.ml_confidence,
        "payment": payment_info
    }), 200

@bp.route("/applications/<int:application_id>/claim-incentive", methods=["POST"])
@jwt_required()
def claim_incentive(application_id):
    current_user_id = int(get_jwt_identity())
    application = Application.query.filter_by(id=application_id, user_id=current_user_id).first()
    
    if not application:
        return jsonify({"message": "Application not found or you don't have permission"}), 404
    
    if application.ml_prediction != "Eligible":
        return jsonify({"message": "Only eligible applications can claim incentives"}), 403
    
    if application.payment:
        return jsonify({"message": "Incentive already claimed for this application"}), 409

    # Require valid account details saved on user
    user = User.query.get(current_user_id)
    if not user.account_name or not user.account_number or not user.bank_id:
        return jsonify({"message": "Please provide your payment details before claiming.", "requires_payment_details": True}), 400

    bank = Bank.query.get(user.bank_id)
    if not bank:
        return jsonify({"message": "Invalid bank on account. Please update your payment details.", "requires_payment_details": True}), 400
    
    incentive_setting = SystemSetting.query.filter_by(key="incentive_amount").first()
    incentive_amount = float(incentive_setting.value) if incentive_setting else 100.0
    
    try:
        payment = Payment(
            application_id=application_id,
            amount=incentive_amount,
            status="completed",
            transaction_id=str(uuid.uuid4()),
            account_name=user.account_name,
            account_number=user.account_number,
            bank_name=bank.name,
            bank_abbreviation=bank.abbreviation,
        )
        
        db.session.add(payment)
        db.session.commit()
        
        return jsonify({
            "message": "Incentive claimed successfully",
            "transaction_id": payment.transaction_id,
            "amount": payment.amount,
            "payment_date": payment.payment_date.isoformat(),
            "status": payment.status,
            "account_name": payment.account_name,
            "account_number": payment.account_number,
            "bank_name": payment.bank_name,
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error processing payment: {str(e)}"}), 500

@bp.route("/banks", methods=["GET"])
@jwt_required()
def get_banks():
    banks = Bank.query.order_by(Bank.name).all()
    return jsonify([{"id": b.id, "name": b.name, "abbreviation": b.abbreviation} for b in banks]), 200
