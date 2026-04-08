import os
from google_adk import Agent, SequentialAgent, ParallelAgent
from langchain.tools import Tool
from langchain_community.tools.wikipedia.tool import WikipediaQueryRun
from langchain_community.utilities.wikipedia import WikipediaAPIWrapper

def check_bank_account(account_number: str, bank_name: str) -> str:
    known_mules = ["1234567890", "9876543210"]
    if account_number in known_mules:
        return f"WARNING: Account {account_number} at {bank_name} is flagged as a known MULE account!"
    return f"Account {account_number} at {bank_name} has no current reports."

verification_agent = Agent(
    name="VerificationAgent",
    instructions="Verify bank accounts using the check_bank_account tool.",
    tools=[Tool(name="check_bank_account", func=check_bank_account, description="Check if a bank account is a known mule account.")]
)

vision_agent = Agent(
    name="VisionAgent",
    instructions="Analyze screenshots for scam red flags.",
    model="gemini-1.5-flash"
)

researcher_agent = Agent(
    name="ResearcherAgent",
    instructions="Search scam patterns using Wikipedia.",
    tools=[WikipediaQueryRun(api_wrapper=WikipediaAPIWrapper())]
)

reporting_agent = Agent(
    name="ReportingAgent",
    instructions="Synthesize findings into a Scam Evidence Report for NSRC 997."
)

scam_analysis_workflow = SequentialAgent(
    name="ScamAnalysisWorkflow",
    agents=[ParallelAgent(name="AnalysisPhase", agents=[researcher_agent, verification_agent]), reporting_agent]
)

concierge_agent = Agent(
    name="ScamGuardConcierge",
    instructions="You are ScamGuard MY. Greet users with 'Selamat sejahtera!' and help them verify accounts, analyze images, or report scams.",
    sub_agents=[verification_agent, vision_agent, scam_analysis_workflow]
)

if __name__ == "__main__":
    print("ScamGuard MY Agentic System Initialized.")
