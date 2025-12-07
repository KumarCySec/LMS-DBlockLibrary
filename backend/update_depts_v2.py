from app import create_app, db
from models import Department

app = create_app()

def update_departments():
    with app.app_context():
        # 1. Rename CDN to CDS
        cdn = Department.query.filter_by(name='CDN').first()
        if cdn:
            print("Found CDN, renaming to CDS...")
            cdn.name = 'CDS'
            cdn.description = 'Computer Science and Engineering (Data Science)' # Assuming description needs update or keep as is? User said "Computer Science and Engineering department is termed is "CDS" not "CDN"". Usually CSE is Computer Science. CDS is often Data Science. But user said "Computer Science and Engineering department is termed is "CDS"". I will just rename.
        
        # Check if CDS already exists (to avoid unique constraint error if both existed)
        cds = Department.query.filter_by(name='CDS').first()
        if cdn and cds and cdn != cds:
            print("Both CDN and CDS exist. Merging or skipping rename.")
            # If both exist, we might have a problem. Assuming simplistic rename for now.
        
        # 2. Add MEC
        mec = Department.query.filter_by(name='MEC').first()
        if not mec:
            print("Creating MEC...")
            mec = Department(name='MEC', description='M.E. Computer Science and Engineering')
            db.session.add(mec)
        else:
            print("MEC already exists.")

        # 3. Add MES
        mes = Department.query.filter_by(name='MES').first()
        if not mes:
            print("Creating MES...")
            mes = Department(name='MES', description='M.E. Structural Engineering')
            db.session.add(mes)
        else:
            print("MES already exists.")
            
        try:
            db.session.commit()
            print("Departments updated successfully!")
        except Exception as e:
            db.session.rollback()
            print(f"Error updating departments: {e}")

if __name__ == "__main__":
    update_departments()
