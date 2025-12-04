from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from models import User

def role_required(required_roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            # Use the single role property
            if user.role not in required_roles and 'Admin' != user.role:
                 return jsonify({"error": "Insufficient permissions"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def permission_required(required_permission):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            # Admin role bypass
            if user.role == 'Admin':
                return fn(*args, **kwargs)

            # Check if user has any role that has the required permission
            has_perm = False
            if user.roles:
                for role in user.roles:
                    if role.permissions:
                        for perm in role.permissions:
                            if perm.name == required_permission:
                                has_perm = True
                                break
                    if has_perm:
                        break
            
            if not has_perm:
                return jsonify({"error": f"Permission '{required_permission}' required"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
