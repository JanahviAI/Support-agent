from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from models import SessionLocal, Ticket, PendingApproval, EmployeeAccess, Employee, User
from agent import process_ticket
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
import json
import os

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI(title="IT Helpdesk Agent")

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

class ApprovalDecision(BaseModel):
    decision: str

class LoginRequest(BaseModel):
    email: str
    password: str

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        role = payload.get("role")
        employee_id = payload.get("employee_id")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"email": email, "role": role, "employee_id": employee_id}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@app.get("/")
def root():
    return {"status": "IT Helpdesk Agent running"}

@app.post("/auth/login")
def login(request: LoginRequest):
    db = SessionLocal()
    user = db.query(User).filter(User.email == request.email).first()
    db.close()

    if not user or not pwd_context.verify(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({
        "sub": user.email,
        "role": user.role,
        "employee_id": user.employee_id
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "employee_id": user.employee_id,
        "email": user.email
    }

@app.get("/employees")
def get_employees(current_user: dict = Depends(get_current_user)):
    db = SessionLocal()
    employees = db.query(Employee).all()
    result = [{"id": e.id, "name": e.name, "department": e.department, "role": e.role} for e in employees]
    db.close()
    return result

@app.post("/tickets/create")
def create_ticket(ticket: dict, current_user: dict = Depends(get_current_user)):
    db = SessionLocal()
    new_ticket = Ticket(
        employee_id=ticket["employee_id"],
        issue_type="general",
        description=ticket["description"],
        status="open",
        priority="normal"
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    ticket_id = new_ticket.id
    db.close()

    return {"ticket_id": ticket_id}

@app.post("/tickets/process")
def process_ticket_endpoint(request: ProcessTicketRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "employee" and current_user["employee_id"] != request.employee_id:
        raise HTTPException(status_code=403, detail="You can only submit tickets for yourself")
    try:
        result = process_ticket(
            ticket_description=request.description,
            employee_id=request.employee_id,
            ticket_id=request.ticket_id
        )
        # If ticket is still open after agent processed it, mark as resolved
        db = SessionLocal()
        ticket = db.query(Ticket).filter(Ticket.id == request.ticket_id).first()
        if ticket and ticket.status == "open":
            ticket.status = "resolved"
            db.commit()
        db.close()
        return {"success": True, "response": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))    

@app.get("/tickets")
def get_tickets(current_user: dict = Depends(get_current_user)):
    db = SessionLocal()
    if current_user["role"] == "employee":
        tickets = db.query(Ticket).filter(
            Ticket.employee_id == current_user["employee_id"]
        ).all()
    else:
        tickets = db.query(Ticket).all()
    result = []
    for t in tickets:
        result.append({
            "id": t.id,
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
def get_pending_approvals(current_user: dict = Depends(require_admin)):
    db = SessionLocal()
    approvals = db.query(PendingApproval).filter(
        PendingApproval.status == "pending"
    ).all()
    result = []
    for a in approvals:
        result.append({
            "id": a.id,
            "ticket_id": a.ticket_id,
            "action_type": a.action_type,
            "action_payload": json.loads(a.action_payload),
            "agent_reasoning": a.agent_reasoning,
            "status": a.status,
            "created_at": str(a.created_at)
        })
    db.close()
    return result

@app.post("/approvals/{approval_id}/decide")
def decide_approval(approval_id: int, decision: ApprovalDecision, current_user: dict = Depends(require_admin)):
    if decision.decision not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Decision must be 'approved' or 'rejected'")

    db = SessionLocal()
    approval = db.query(PendingApproval).filter(PendingApproval.id == approval_id).first()

    if not approval:
        db.close()
        raise HTTPException(status_code=404, detail="Approval not found")

    if approval.status != "pending":
        db.close()
        raise HTTPException(status_code=400, detail="This approval has already been decided")

    approval.status = decision.decision

    if decision.decision == "approved" and approval.action_type == "grant_access":
        payload = json.loads(approval.action_payload)
        new_access = EmployeeAccess(
            employee_id=payload["employee_id"],
            system_name=payload["system_name"]
        )
        db.add(new_access)

    ticket = db.query(Ticket).filter(Ticket.id == approval.ticket_id).first()
    if ticket:
        ticket.status = "resolved" if decision.decision == "approved" else "rejected"

    db.commit()
    db.close()
    return {"success": True, "decision": decision.decision}