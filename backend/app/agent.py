from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from typing import TypedDict, Annotated
import operator
import os
from dotenv import load_dotenv
from agent_tools import make_tools

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '..', '.env'), override=True)

class AgentState(TypedDict):
    messages: Annotated[list, operator.add]

SYSTEM_PROMPT = """You are an IT helpdesk AI agent. Handle employee IT support tickets using the available tools.

Tools:
- look_up_employee: get employee details and current system access
- check_ticket_status: get ticket status and details
- reset_password: queue password reset for human approval
- grant_software_access: request system access (auto-approves low risk, queues medium, escalates high)
- escalate_to_human: for issues requiring human intervention

Rules:
1. Always call look_up_employee first
2. Access requests: if employee lacks access → grant_software_access. If they have it → escalate_to_human with technical issue note
3. Login/password issues → reset_password
4. Hardware or unclear issues → escalate_to_human
5. Every ticket must result in exactly one tool call
6. Be concise in responses"""

def create_agent():
    tools=make_tools()

    llm=ChatAnthropic(
        model="claude-haiku-4-5",
        api_key=os.getenv("ANTHROPIC_API_KEY"),
        max_tokens=2000
    )
    llm_with_tools=llm.bind_tools(tools)

    def agent_node(state: AgentState):
        messages=state["messages"]

        if not any(isinstance(m, SystemMessage) for m in messages):
            messages=[SystemMessage(content=SYSTEM_PROMPT)] + messages
        response=llm_with_tools.invoke(messages)
        return {"messages": [response]}
    
    tool_node=ToolNode(tools)

    def should_continue(state: AgentState):
        last_messages=state["messages"][-1]
        if hasattr(last_messages, "tool_calls") and last_messages.tool_calls:
            return "tools"
        return END
    
    graph=StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)
    graph.set_entry_point("agent")
    graph.add_conditional_edges("agent", should_continue)
    graph.add_edge("tools","agent")

    return graph.compile()

def process_ticket(ticket_description: str, employee_id: int, ticket_id: int) -> str:
    agent = create_agent()

    user_message=f"""
    Please handle this IT support ticket:
    Ticket ID:{ticket_id}
    Employee ID:{employee_id}
    Issue: {ticket_description}
    """

    result=agent.invoke({
        "messages": [HumanMessage(content=user_message)]
    })

    final_message=result["messages"][-1]
    return final_message.content
        
