from flask import Blueprint, request, jsonify
from extensions import db, jwt
from models import User, Role, user_roles
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Basic validation
    required_fields = ['name', 'roll_number', 'email', 'password', 'batch', 'department_id']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    if User.query.filter((User.email == data['email']) | (User.roll_number == data['roll_number'])).first():
        return jsonify({"error": "User with this email or roll number already exists"}), 409

    # Create Student
    new_user = User(
        name=data['name'],
        roll_number=data['roll_number'],
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        batch=data['batch'],
        department_id=data['department_id'],
        phone_number=data.get('phone_number'),
        status='pending_approval' # Default status
    )
    
    # Assign Student Role
    student_role = Role.query.filter_by(name='Student').first()
    if student_role:
        new_user.roles.append(student_role)
    
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Registration successful. Please wait for admin approval."}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid credentials"}), 401

    if user.status != 'approved':
        return jsonify({"error": f"Account is {user.status}. Please contact admin."}), 403

    # Create JWT
    # Identity can be user ID, but let's store more info in claims if needed
    access_token = create_access_token(identity=str(user.id))
    
    # Get roles
    roles = [r.name for r in user.roles]
    
    # Get permissions
    permissions = set()
    for role in user.roles:
        for perm in role.permissions:
            permissions.add(perm.name)

    return jsonify({
        "access_token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "roles": roles,
            "permissions": list(permissions),
            "department_id": user.department_id
        }
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404

    roles = [r.name for r in user.roles]
    permissions = set()
    for role in user.roles:
        for perm in role.permissions:
            permissions.add(perm.name)

    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "roll_number": user.roll_number,
        "department_id": user.department_id,
        "roles": roles,
        "permissions": list(permissions),
        "status": user.status
    }), 200
