from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from models import SessionLocal, Ticket, PendingApproval, EmployeeAccess
from agent import process_ticket
import json

app=FastAPI(title="IT Helpdesk Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"]
)

class ProcessTicketRequest(BaseModel):
    ticket_id: int
    employee_id: int
    description: str

class ApprovalDesicion(BaseModel):
    decision: str

@app.get("/")
def root():
    return {"status": "IT Helpdesk Agent running"}

@app.post("/tickets/process")
def process_ticket_endpoint(request: ProcessTicketRequest):
    try:
        result=process_ticket(
            ticket_description=request.description,
            employee_id=request.employee_id,
            ticket_id=request.ticket_id
        )
        return {"success": True, "response": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/tickets")
def get_tickets():
    db=SessionLocal()
    tickets=db.query(Ticket).all()
    result=[]
    for t in tickets:
        result.append({
            "id":t.id,
            "employee_id": t.employee_id,
            "issue_type": t.issue_type,
            "description": t.description,
            "status": t.status,
            "priority": t.priority,
            "created_at": str(t.created_at)
        })
    db.close()
    return result

@app.get("/approvals/pending")
def get_pending_approvals():
    db=SessionLocal()
    approvals=db.query(PendingApproval).filter(
        PendingApproval.status=="pending"
    ).all()
    result=[]
    for a in approvals:
        result.append({
            "id":a.id,
            "ticket_id":a.ticket_id,
            "action_type":a.action_type,
            "action_payload": a.action_payload,
            "agent_reasoning": a.agent_reasoning,
            "status": a.status,
            "created_at": str(a.created_at)
        })
    db.close()
    return result

@app.post("/approvals/{approval_id}/decide")
def decide_approval(approval_id: int, decision: ApprovalDesicion):
    if decision.decision not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Decision must be 'approved' or 'rejected'. ")
    
    db=SessionLocal()
    approval=db.query(PendingApproval).filter(PendingApproval.id==approval_id).first()

    if not approval:
        db.close()
        raise HTTPException(status_code=404, detail="Approval not found.")
    
    if approval.status !="pending":
        db.close()
        raise HTTPException(status_code=400, detail="This approval has already been decided.")
    
    approval.status=decision.decision

    if decision.decision == "approved" and approval.action_type=="grant_access":
        payload = json.loads(approval.action_payload)
        new_access = EmployeeAccess(
            employee_id = payload["employee_id"],
            system_name = payload["system_name"]
        )
        db.add(new_access)

    ticket=db.query(Ticket).filter(Ticket.id == approval.ticket_id).first()
    if ticket:
        ticket.status = "resolved" if decision.decision == "approved" else "rejected"

    db.commit()
    db.close()
    return {"success": True, "decision": decision.decision}