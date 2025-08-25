# LMS-Dblock

## Configuration

Set environment variables (recommended using a `.env` file or host env):

- `FLASK_ENV` = `development` or `production`
- `SECRET_KEY` = strong random secret
- `DATABASE_URL` = e.g. `sqlite:///instance/Kishorebase.db` or a PostgreSQL URI

See `website/config.py` for full settings.

## Development

Install dependencies:

```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Run:

```
python LMS_app.py
```

## Database migrations

Initialize and upgrade schema:

```
flask db init
flask db migrate -m "schema updates"
flask db upgrade
```

## Production

Use a WSGI server:

```
gunicorn -w 4 -b 0.0.0.0:8000 LMS_app:app
```

Ensure `FLASK_ENV=production`, and set `SECRET_KEY` and `DATABASE_URL`.
