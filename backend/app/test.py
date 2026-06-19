python -c "
from models import SessionLocal, Employee, Ticket
db = SessionLocal()
employees = db.query(Employee).all()
for e in employees:
    print(e.name, e.department)
tickets = db.query(Ticket).all()
for t in tickets:
    print(t.issue_type, t.description[:40])
"