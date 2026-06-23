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
print("Key loaded:", os.getenv("ANTHROPIC_API_KEY")[:10] if os.getenv("ANTHROPIC_API_KEY") else "NOT FOUND")

class AgentState(TypedDict):
    messages: Annotated[list, operator.add]

SYSTEM_PROMPT= """You are an IT helpdesk agent for a company. Your job is to handle employee IT suppor tickets.

You have access to the following tools:
- look_up_employees: to get employee details and current access.
- check_ticket_status: to check a ticket's current state.
- reset_password: to queue a password reset for human approval.
- grant_software_access: to request software access (auyo-approves low risk, queues medium, escalates high).
- escalate_to_human: for anything you cannot handle automatically.

Guidelines:
1.Always look up the employee first before taking any action
2.Use the most appropriate tool based on the ticker description
3.For password issues, use reset_password
4.For access requests, use grant_software_access
5.For hardware issues or anything unclear, use escalate_to_human
6.Always explain what action you took and why
7.Be concise and professional.
"""

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
        

if __name__ == "__main__":
    # Ticket 1: password reset (medium risk)
    print("=== TEST 1: Password Reset ===")
    result = process_ticket(
        "I am locked out of my GitHub account and cannot push my code",
        employee_id=1,
        ticket_id=1
    )
    print(result)