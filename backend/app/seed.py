from models import init_db, SessionLocal, Employee, System, Ticket, EmployeeAccess

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

    tickets=[
        Ticket(employee_id=1, issue_type="password_reset", description="Locked out of my GitHub account, can't push code", priority="high"),
        Ticket(employee_id=2, issue_type="access_request", description="Need access to Figma to review design mockups", priority="normal"),
        Ticket(employee_id=4, issue_type="access_request", description="Requesting AWS Console access for deployment tasks", priority="normal"),
        Ticket(employee_id=3, issue_type="other", description="Laptop running very slow, affects daily work", priority="low")
    ]
    db.add_all(tickets)
    db.commit()

    db.close()
    print("Database seeded successfully.")

if __name__=="__main__":
    seed()

