from models import init_db, SessionLocal, Employee, System, Ticket, EmployeeAccess
from passlib.context import CryptContext
from models import User


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed():
    init_db()
    db=SessionLocal()

    employees=[
        Employee(name="Alisha Patel", email="alisha@company.com", department="Engineering", role="Junior Developer"),
        Employee(name="Rohan Mehta", email="rohan@company.com", department="Finance", role="Analyst"),
        Employee(name="Sara Khan", email="sara@company.com", department="HR", role="Manager"),
        Employee(name="Dev Nair", email="dev@company.com", department="Engineering", role="Intern")
    ]
    db.add_all(employees)
    db.commit()

    systems=[
        System(name="Slack", access_level="low"),
        System(name="Jira", access_level="low"),
        System(name="GitHub", access_level="medium"),
        System(name="AWS Console", access_level="high"),
        System(name="Payroll System", access_level="high"),
        System(name="Figma", access_level="low")
    ]
    db.add_all(systems)
    db.commit()

    accesses=[
        EmployeeAccess(employee_id=1, system_name="Slack"),
        EmployeeAccess(employee_id=1, system_name="GitHub"),
        EmployeeAccess(employee_id=2, system_name="Slack"),
        EmployeeAccess(employee_id=2, system_name="Payroll System"),
        EmployeeAccess(employee_id=3, system_name="Slack"),
        EmployeeAccess(employee_id=3, system_name="Jira")
    ]
    db.add_all(accesses)
    db.commit()



    users= [
        User(
                email="alisha@company.com",
            hashed_password=pwd_context.hash("password123"),
            role="employee",
            employee_id=1
        ),
        User(
            email="rohan@company.com",
            hashed_password=pwd_context.hash("password123"),
            role="employee",
            employee_id=2
        ),
        User(
            email="sara@company.com",
            hashed_password=pwd_context.hash("password123"),
            role="employee",
            employee_id=3
        ),
        User(
            email="dev@company.com",
            hashed_password=pwd_context.hash("password123"),
            role="employee",
            employee_id=4
        ),
        User(
            email="admin@company.com",
            hashed_password=pwd_context.hash("admin123"),
            role="admin",
            employee_id=None
        )
    ]

    db.add_all(users)
    db.commit()
    print("Database seeded successfully.")
    db.close()

if __name__=="__main__":
    seed()

