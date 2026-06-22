from langchain_core.tools import StructuredTool
from tools import(look_up_employee, check_ticket_status, reset_password, grant_software_access, escalate_to_human)
import json

def make_tools():
    return [
        StructuredTool.from_function(
            func=look_up_employee,
            name="look_up_employee",
            description="Look up an employee by their ID. Return their name, email, department, role and list of systems they currently have access to. Use the first before taking any action on a ticket."
        ),
        StructuredTool.from_function(
            func=check_ticket_status,
            name="check_ticket_status",
            description="Check the current status of an IT ticket by ticket ID. Return status, priority, issue type and description."
        ),
        StructuredTool.from_function(
            func=reset_password,
            name="reset_password",
            description="Queue a password request for human approval. Use when an employee is locked out of a system or needs their password reset. Always requires human approval before executing."
        ),
        StructuredTool.from_function(
            func=grant_software_access,
            name="grant_software_access",
            description="Request software access for an employee. Automatically grants low-risk systems (Slack, Jira, Figma). Queues medium-risk systems (Github) for human approval. Always escalates high-risk systems (AWS Console, Payroll System) to human review."
        ),
        StructuredTool.from_function(
            func=escalate_to_human,
            name="escalate_to_human",
            description="Escalate a ticket to a human IT agent when the request cannot be handles automatically. Use for hardware issues, unclear requests, or anything outside the scope of the other tools."
        )
    ]


if __name__ == "__main__":
    tools = make_tools()
    for tool in tools:
        print(f"Tool: {tool.name}")
        print(f"Description: {tool.description}")
        print()