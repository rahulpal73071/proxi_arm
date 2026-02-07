"""
Proxi AI Agent - Context-Aware Cloud Guardian Bot

This module implements the AI agent that acts as a Site Reliability Engineer,
using LangChain to reason about cloud operations while respecting policy constraints.
"""

import os
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
import httpx
from langchain_classic.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.tools import Tool
from langchain_core.prompts import ChatPromptTemplate
# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))


class ProxiAgent:
    """
    AI Agent that manages cloud infrastructure with policy enforcement.
    
    This agent acts as a Site Reliability Engineer, attempting to resolve
    infrastructure issues while respecting security policies.
    """
    
    def __init__(self, mcp_server_url: str = "http://localhost:8000"):
        """
        Initialize the Proxi Agent. LLM is configured via .env only.
        Requires one of: GOOGLE_API_KEY, GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY.
        """
        self.mcp_server_url = mcp_server_url
        self.client = httpx.Client(timeout=30.0)
        self.tools = self._create_tools()
        self.llm = self._create_llm()
        self.agent_executor = self._create_agent()

    def _create_llm(self):
        """Create the LLM from .env. Requires at least one API key in .env."""
        # Gemini (Google) - prefer GOOGLE_API_KEY or GEMINI_API_KEY
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
            if api_key:
                return ChatGoogleGenerativeAI(
                    model="gemini-2.5-flash",
                    temperature=0,
                    api_key=api_key
                )
        except Exception:
            pass
        try:
            from langchain_openai import ChatOpenAI
            if os.getenv("OPENAI_API_KEY"):
                return ChatOpenAI(model="gpt-4", temperature=0)
        except Exception:
            pass
        try:
            from langchain_anthropic import ChatAnthropic
            if os.getenv("ANTHROPIC_API_KEY"):
                return ChatAnthropic(model="claude-3-sonnet-20240229", temperature=0)
        except Exception:
            pass
        raise RuntimeError(
            "No LLM API key found. Set one of these in .env: "
            "GOOGLE_API_KEY, GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY"
        )
    
    def _execute_mcp_tool(self, tool_name: str, **kwargs) -> str:
        """
        Execute a tool through the MCP server.
        
        This method sends tool execution requests to the MCP server,
        which enforces policy validation before execution.
        """
        try:
            response = self.client.post(
                f"{self.mcp_server_url}/tools/execute",
                json={
                    "tool_name": tool_name,
                    "arguments": kwargs,
                    "context": {}
                }
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get("policy_violation"):
                return f"❌ POLICY BLOCKED: {result.get('blocked_reason', 'Unknown reason')}"
            elif result.get("success"):
                return f"✓ Success: {result.get('result', 'Operation completed')}"
            else:
                return f"❌ Error: {result.get('error', 'Unknown error')}"
                
        except Exception as e:
            return f"❌ Connection error: {str(e)}"
    
    def _create_tools(self) -> List[Tool]:
        """Create LangChain tools that wrap MCP server endpoints."""
        return [
            Tool(
                name="list_services",
                func=lambda: self._execute_mcp_tool("list_services"),
                description="List all available services and their exact identifiers."
            ),
            Tool(
                name="get_service_status",
                func=lambda service_name=None: self._execute_mcp_tool(
                    "get_service_status", 
                    service_name=service_name if service_name else None
                ),
                description="Get the current health status of cloud services. "
                           "Use this to diagnose issues. No arguments needed for all services, "
                           "or provide service_name for specific service."
            ),
            Tool(
                name="read_logs",
                func=lambda lines=10: self._execute_mcp_tool("read_logs", lines=int(lines)),
                description="Read recent system logs. Provide number of lines to read (default 10)."
            ),
            Tool(
                name="restart_service",
                func=lambda service_name: self._execute_mcp_tool(
                    "restart_service", 
                    service_name=service_name
                ),
                description="Restart a cloud service. WARNING: Only available in EMERGENCY mode. "
                           "Requires service_name parameter."
            ),
            Tool(
                name="scale_fleet",
                func=lambda count: self._execute_mcp_tool("scale_fleet", count=int(count)),
                description="Scale the number of service instances. WARNING: Only available in EMERGENCY mode. "
                           "Requires count parameter (integer)."
            ),
            Tool(
                name="delete_database",
                func=lambda db_name: self._execute_mcp_tool("delete_database", db_name=db_name),
                description="Delete a database. WARNING: DESTRUCTIVE OPERATION - Always blocked by policy."
            )
        ]
    
    def _create_agent(self) -> AgentExecutor:
        """Create the LangChain agent with system prompt."""
        system_prompt = """You are Proxi, an AI Site Reliability Engineer managing cloud infrastructure.

Your mission is to maintain system health and resolve incidents while strictly adhering to security policies.

CRITICAL POLICY AWARENESS:
- You operate under a Policy Engine that enforces context-aware security constraints
- In NORMAL mode: You can only READ data (get_service_status, read_logs)
- In EMERGENCY mode: You can take corrective actions (restart_service, scale_fleet) BUT still cannot perform destructive operations
- Destructive operations like delete_database are ALWAYS BLOCKED regardless of mode

BEHAVIORAL GUIDELINES:
1. When a tool is blocked by policy, DO NOT retry it - the policy is absolute
2. If blocked, acknowledge the policy constraint and explain WHY it's blocked
3. Suggest alternative safer approaches when your preferred action is blocked
4. Always check service status before attempting corrective actions
5. Be transparent about what you can and cannot do in the current mode

RESPONSE STYLE:
- Be concise and professional
- When blocked, explain the policy reason clearly
- Propose alternative solutions when primary action is unavailable
- Show your reasoning process step by step

Remember: Safety and policy compliance come before speed of resolution."""

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{input}"),
            ("placeholder", "{agent_scratchpad}")
        ])
        agent = create_tool_calling_agent(self.llm, self.tools, prompt)
        return AgentExecutor(
            agent=agent,
            tools=self.tools,
            verbose=True,
            return_intermediate_steps=True
        )

    def _normalize_steps(self, raw_steps: Any) -> List[Dict[str, Any]]:
        """Convert LangChain intermediate_steps to a uniform format for the frontend."""
        steps = []
        if not raw_steps:
            return steps
        for i, item in enumerate(raw_steps):
            if isinstance(item, (list, tuple)) and len(item) >= 2:
                action, observation = item[0], item[1]
                tool_name = getattr(action, "tool", None) or (action.get("tool") if isinstance(action, dict) else "?")
                tool_input = getattr(action, "tool_input", None) or (action.get("tool_input") if isinstance(action, dict) else {})
                log = getattr(action, "log", None) or (action.get("log") if isinstance(action, dict) else "")
                steps.append({
                    "step_number": i + 1,
                    "thought": log or f"Use tool: {tool_name}",
                    "action": tool_name,
                    "tool_name": tool_name,
                    "tool_input": tool_input,
                    "result": str(observation)[:500],
                    "blocked": "POLICY BLOCKED" in str(observation),
                })
            elif isinstance(item, dict):
                steps.append({
                    "step_number": item.get("step_number", i + 1),
                    "thought": item.get("thought", ""),
                    "action": item.get("action", item.get("tool_name", "")),
                    "tool_name": item.get("tool_name", item.get("action", "")),
                    "tool_input": item.get("tool_input", {}),
                    "result": item.get("result", ""),
                    "blocked": item.get("blocked", False),
                })
        return steps

    def run(self, task: str) -> Dict[str, Any]:
        """
        Execute a task through the agent.
        
        Args:
            task: The task description or question
        
        Returns:
            Dictionary with response, steps (for frontend flow), success, task, error.
        """
        print(f"\n{'='*70}")
        print(f"📋 AGENT TASK: {task}")
        print(f"{'='*70}\n")
        
        try:
            result = self.agent_executor.invoke({"input": task})
            output = result.get("output", str(result))
            raw_steps = result.get("intermediate_steps", [])
            steps = self._normalize_steps(raw_steps)
            return {
                "success": True,
                "task": task,
                "response": output,
                "steps": steps,
            }
        except Exception as e:
            return {
                "success": False,
                "task": task,
                "error": str(e),
                "response": str(e),
                "steps": [],
            }
    
    def get_current_mode(self) -> str:
        """Get the current operational mode from the MCP server."""
        try:
            response = self.client.get(f"{self.mcp_server_url}/policy/status")
            return response.json().get("current_mode", "UNKNOWN")
        except:
            return "UNKNOWN"
