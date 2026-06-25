from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, timezone

Base=declarative_base()

class Employee(Base):
    __tablename__="employees"
    id=Column(Integer,primary_key=True)
    name=Column(String, nullable=True)
    email=Column(String, unique=True, nullable=True)
    department=Column(String)
    role=Column(String)

    tickets=relationship("Ticket", back_populates="employee")
    access_records=relationship("EmployeeAccess", back_populates="employee")

class System(Base):
    __tablename__="systems"

    id=Column(Integer, primary_key=True)
    name=Column(String, nullable=True)
    access_level=Column(String)

class EmployeeAccess(Base):
    __tablename__="employee_access"

    id=Column(Integer, primary_key=True)
    employee_id=Column(Integer, ForeignKey("employees.id"))
    system_name=Column(String)
    granted_at=Column(DateTime, default=lambda: datetime.now(timezone.utc))

    employee=relationship("Employee", back_populates="access_records")

class Ticket(Base):
    __tablename__="tickets"

    id=Column(Integer, primary_key=True)
    employee_id=Column(Integer, ForeignKey("employees.id"))
    issue_type=Column(String)
    description=Column(Text)
    status=Column(String, default="open")
    priority=Column(String, default="normal")
    created_at=Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at= Column(DateTime, nullable=True)

    employee=relationship("Employee", back_populates="tickets")

class PendingApproval(Base):
    __tablename__="pending_approvals"

    id=Column(Integer, primary_key=True)
    ticket_id=Column(Integer, ForeignKey("tickets.id"))
    action_type=Column(String)
    action_payload=Column(Text)
    agent_reasoning= Column(Text)
    status=Column(String, default="pending")
    created_at= Column(DateTime, default=lambda: datetime.now(timezone.utc))

class User(Base):
    __tablename__="users"

    id= Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"))

DATABASE_URL= "sqlite:///./helpdesk.db"
engine=create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal=sessionmaker(bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
