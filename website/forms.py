from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField
from wtforms.validators import DataRequired


class CSRFProtectForm(FlaskForm):
    """Base form that only provides CSRF token."""
    pass


class LoginForm(FlaskForm):
    identifier = StringField(validators=[DataRequired()])
    password = PasswordField(validators=[DataRequired()])
