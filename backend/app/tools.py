from models import SessionLocal, Employee, Ticket, EmployeeAccess, System, PendingApproval
import json
from datetime import datetime, timezone

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


def reset_password(ticket_id: int, employee_id: int, system_name: str) -> dict:
    """Queue a password reset for human approval."""
    db=SessionLocal()

    employee= db.query(Employee).filter(Employee.id==employee_id).first()
    if not employee:
        db.close()
        return {"error": f"No employee found with id {ticket_id}"}
    
    ticket=db.query(Ticket).filter(Ticket.id==ticket_id).first()
    if not ticket:
        db.close()
        return {"error":f"No ticket found with id {ticket_id}"}
    employee_name=employee.name
    
    approval=PendingApproval(
        ticket_id=ticket_id,
        action_type="reset_password",
        action_payload=json.dumps({
            "employee_id":employee_id,
            "employee_name":employee.name,
            "system_name":system_name
        }),
        agent_reasoning=f"Employee {employee.name} requested password reset for {system_name}. this requires human verification before executing.",
        status="pending"
    )
    db.add(approval)

    ticket.status="pending_approval"
    db.commit()
    db.close()

    return{
        "result": "queued_for_approval",
        "message": f"Password reset for {system_name} queued. A human must approve before it executes.",
        "employee": employee_name,
        "system": system_name
    }

def grant_software_access(ticket_id: int, employee_id: int, system_name: str) -> dict:
    """Grants access to software based on the risk level."""
    db=SessionLocal()

    employee=db.query(Employee).filter(Employee.id==employee_id).first()
    if not employee:
        db.close()
        return {"error": f"No employee found with id {employee_id}"}
    
    system=db.query(System).filter(System.name==system_name).first()
    if not system:
        db.close()
        return {"error":f"{system_name} System not found"}
    
    existing_access=db.query(EmployeeAccess).filter(EmployeeAccess.employee_id==employee_id, EmployeeAccess.system_name==system_name).first()
    if existing_access:
        db.close()
        return {"message":f"Employee {employee_id} already has access to system:{system_name}"}
    
    ticket=db.query(Ticket).filter(Ticket.id==ticket_id).first()
    if not ticket:
        db.close()
        return {"error": f"No ticket found with id {ticket_id}"}
    employee_name=employee.name
    employee_email=employee.email
    
    if system.access_level=="low":
        addAccess=EmployeeAccess(
            employee_id=employee_id,
            system_name=system_name
        )
        db.add(addAccess)
        ticket.status="resolved"
        db.commit()
        db.close()
        return {
            "result":"auto_approved",
            "message":f"Access to {system_name} granted automatically (low risk).",
            "employee": employee_name,
            "system": system_name
        }
    elif system.access_level=="medium":
        approval=PendingApproval(
            ticket_id=ticket_id,
            action_type="access_request",
            action_payload=json.dumps({
                "employee_id":employee_id,
                "employee_name":employee.name,
                "system_name":system_name
            }),
            agent_reasoning=f"Employee {employee_id} requests access of system:{system_name} (medium risk). Requires human review before granting.",
            status="pending"
        )
        db.add(approval)
        ticket.status="approval_pending"
        db.commit()
        db.close()
        return {
            "result":"queued_for_approval",
            "message": f"Access to {system_name} queued for human approval (medium risk).",
            "employee": employee_name,
            "system": system_name
        }
    else:
        approval=PendingApproval(
            ticket_id=ticket_id,
            action_type="access_request",
            action_payload=json.dumps({
                "employee_id":employee_id,
                "employee_name":employee.name,
                "system_name":system_name
            }),
            agent_reasoning=f"High risk request and must be approved manually.",
            status="pending_approval"
        )
        db.add(approval)
        ticket.status="escalated"
        db.commit()
        db.close()
        return {
            "result": "escalated",
            "message": f"Access to {system_name} escalated to IT team (high risk). Human approval mandatory.",
            "employee": employee_name,
            "system": system_name
        }



    