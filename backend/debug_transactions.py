from app import create_app
from extensions import db
from models import Transaction

app = create_app()

with app.app_context():
    status_filter = 'REQUESTED'
    query = Transaction.query.filter_by(status=status_filter)
    txs = query.order_by(Transaction.id.desc()).all()
    print(f"Found {len(txs)} transactions with status '{status_filter}'")
    for tx in txs:
        print(f"ID: {tx.id}, Status: {tx.status}")
