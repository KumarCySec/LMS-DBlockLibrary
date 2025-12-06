from app import create_app
try:
    print("Attempting to create app...")
    app = create_app()
    print("App created successfully!")
except Exception as e:
    import traceback
    traceback.print_exc()
