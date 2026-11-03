from flask import jsonify, request
from app.auth import bp
from app.models import User
from app import db, bcrypt, jwt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import or_

@bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    surname = data.get("surname")
    firstname = data.get("firstname")
    middlename = data.get("middlename")
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not surname or not firstname or not email or not password:
        return jsonify({"message": "Missing username, fullname, email, or password"}), 400
    if not isinstance(username, str) or not isinstance(email, str) or not isinstance(password, str):
        return jsonify({"message": "Invalid data types for username, email, or password"}), 400
    if not len(username) >= 3 or not len(password) >= 6:
        return jsonify({"message": "Username must be at least 3 characters and password at least 6 characters"}), 400
    if "@" not in email or "." not in email:
        return jsonify({"message": "Invalid email format"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Username already exists"}), 409

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already registered"}), 409

    new_user = User(surname=surname, firstname=firstname, middlename=middlename, username=username, email=email)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201



@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    identifier = data.get("username")  # can be username OR email
    password = data.get("password")

    if not identifier or not password:
        return jsonify({"message": "Missing username/email or password"}), 400

    if not isinstance(identifier, str) or not isinstance(password, str):
        return jsonify({"message": "Invalid data types for username/email or password"}), 400

    #  check both username OR email
    user = User.query.filter(
        or_(User.username == identifier, User.email == identifier)
    ).first()

    if user and user.check_password(password):
        additional_claims = {"roles": user.role}
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims=additional_claims
        )
        return jsonify(access_token=access_token, user_role=user.role), 200

    return jsonify({"message": "Invalid credentials"}), 401

@bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    jti = get_jwt()["jti"]
    from app import blacklist
    blacklist.append(jti)
    return jsonify(msg="Successfully logged out"), 200

@bp.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    current_user_id = get_jwt_identity()
    current_user_role = get_jwt()["roles"]
    return jsonify(logged_in_as=current_user_id, user_role=current_user_role), 200
