from website import create_app
from website.auth import limiter


app = create_app()
limiter.init_app(app)

    
if __name__ == '__main__':
    # Development-only run block. In production, use a WSGI server (gunicorn/uwsgi).
    app.run(host='0.0.0.0', port=8000)
    