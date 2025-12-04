from app import create_app
from extensions import db
from models import Transaction

app = create_app()

with app.app_context():
    txs = Transaction.query.order_by(Transaction.id.desc()).limit(5).all()
    print(f"Testing serialization for {len(txs)} transactions...")
    
    for tx in txs:
        print(f"--- Transaction {tx.id} ---")
        try:
            print(f"Item: {tx.item.title if tx.item else 'None'}")
            print(f"Borrower: {tx.borrower.name if tx.borrower else 'None'}")
            
            # Test the problematic fields
            print("Accessing copy...")
            if tx.copy_id:
                print(f"Copy ID: {tx.copy_id}")
                print(f"Copy: {tx.copy}")
                print(f"Copy Acc: {tx.copy.acc_no if tx.copy else 'N/A'}")
            else:
                print("No Copy ID")
                
            print("Accessing approver...")
            print(f"Approver: {tx.approved_by.name if tx.approved_by else 'None'}")
            
            print("Accessing rejector...")
            print(f"Rejector: {tx.rejected_by.name if tx.rejected_by else 'None'}")
            
            print("Accessing processor...")
            print(f"Processor: {tx.processed_by.name if tx.processed_by else 'None'}")
            
            print("Serialization successful")
        except Exception as e:
            print(f"FAILED: {e}")
            import traceback
            traceback.print_exc()
