from models import SessionLocal, Employee, Ticket, EmployeeAccess, System, PendingApproval
import json

def look_up_employee(employee_id: int) -> dict:
    """Find an employee and their current system access."""
    db=SessionLocal()
    employee=db.query(Employee).filter(Employee.id==employee_id).first()

    if not employee:
        db.close()
        return{'error':f"No employee found with id {employee_id}"}
    
    access=db.query(EmployeeAccess).filter(EmployeeAccess.employee_id==employee_id).all()
    access_list=[a.system_name for a in access]

    result={
        "id": employee.id,
        "name": employee.name,
        "email": employee.email,
        "department": employee.department,
        "role": employee.role,
        "current_access": access_list
    }

    db.close()
    return result

def check_ticket_status(ticket_id: int) -> dict:
    """looks up for a ticket and returns its status, priority, issue_type, description"""
    db=SessionLocal()
    ticket=db.query(Ticket).filter(Ticket.id==ticket_id).first()

    if not ticket:
        db.close()
        return{'error':f"no ticket found with id {ticket_id}"}
    

    result={
        "id": ticket.id,
        "status": ticket.status,
        "priority": ticket.priority,
        "issue_type": ticket.issue_type,
        "description": ticket.description
    }

    db.close()
    return result


if __name__=="__main__":
    print(look_up_employee(1))
    print(check_ticket_status(1))
    print(check_ticket_status(999))

    