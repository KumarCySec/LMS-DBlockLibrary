import csv
import io
from datetime import datetime

def parse_date(date_str):
    if not date_str:
        return None
    # Common formats
    formats = (
        '%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y', 
        '%d-%b-%y', '%d-%b-%Y', 
        '%d/%m/%y', 
        '%m/%d/%Y', 
        '%Y/%m/%d',
        '%d.%m.%Y', '%d.%m.%y'
    )
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            pass
    print(f"Failed to parse: '{date_str}' (Length: {len(date_str)})")
    return None

csv_path = '../DB.csv'

try:
    with open(csv_path, 'r', encoding='utf-8') as f:
        # Replicate the io.StringIO approach if needed, but direct read is fine
        # But wait, import_routes uses: stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
        # Let's try to read normally first.
        reader = csv.DictReader(f)
        print(f"Columns: {reader.fieldnames}")
        
        count = 0
        for row in reader:
            count += 1
            if count > 5: break
            
            # Clean row data
            data = {}
            for k, v in row.items():
                key = k.strip() if k else None
                val = v.strip() if v and v.strip() else None
                if key:
                    data[key] = val
            
            date_received = data.get('Date Received')
            parsed = parse_date(date_received)
            print(f"Row {count}: Raw '{date_received}' -> Parsed: {parsed}")

except Exception as e:
    print(f"Error: {e}")
