"""
MCP (Model Context Protocol) Server with Chatbot Response Storage

This FastAPI server includes an API to store and retrieve chatbot responses.
Backend runs continuously, chatbot only executes when frontend sends requests.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
import sys
from datetime import datetime
from pathlib import Path
import asyncio
from collections import defaultdict

# Add src directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.guardrails.policy_engine import PolicyEngine, PolicyViolationError
from src.mcp_server.tools import (
    cloud_infra,
    get_service_status,
    list_services,
    read_logs,
    restart_service,
    scale_fleet,
    delete_database
)


# Chatbot Conversation Storage
class ConversationStore:
    """Stores all chatbot conversations and responses"""
    
    def __init__(self):
        self.conversations: Dict[str, List[Dict]] = defaultdict(list)
        self.active_tasks: Dict[str, bool] = {}
    
    def add_message(self, session_id: str, role: str, content: str, metadata: dict = None):
        """Add a message to the conversation"""
        message = {
            "id": len(self.conversations[session_id]) + 1,
            "role": role,
            "content": content,
            "metadata": metadata or {},
            "timestamp": datetime.now().isoformat()
        }
        self.conversations[session_id].append(message)
        return message
    
    def get_conversation(self, session_id: str) -> List[Dict]:
        """Get all messages for a session"""
        return self.conversations[session_id]
    
    def clear_conversation(self, session_id: str):
        """Clear a conversation"""
        self.conversations[session_id] = []
    
    def is_task_active(self, session_id: str) -> bool:
        """Check if a task is currently running"""
        return self.active_tasks.get(session_id, False)
    
    def set_task_active(self, session_id: str, active: bool):
        """Set task active status"""
        self.active_tasks[session_id] = active


# Global conversation store
conversation_store = ConversationStore()


# Initialize FastAPI app
app = FastAPI(
    title="Proxi MCP Server",
    description="Context-Aware Cloud Guardian with Chatbot Response Storage",
    version="2.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Initialize Policy Engine
policy_path = Path(__file__).parent.parent.parent / "policies" / "ops_policy.json"
policy_engine = PolicyEngine(str(policy_path))


# Request/Response Models
class ToolRequest(BaseModel):
    """Request model for tool execution."""
    tool_name: str = Field(..., description="Name of the tool to execute")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Tool arguments")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Execution context")


class ToolResponse(BaseModel):
    """Response model for tool execution."""
    success: bool
    result: Optional[Any] = None
    error: Optional[str] = None
    policy_violation: bool = False
    blocked_reason: Optional[str] = None


class ModeChangeRequest(BaseModel):
    """Request model for changing operational mode."""
    mode: str = Field(..., description="Mode to switch to (NORMAL or EMERGENCY)")


class ChatMessage(BaseModel):
    """Chat message from frontend"""
    message: str = Field(..., description="User message to chatbot")
    session_id: str = Field(default="default", description="Session ID for conversation tracking")


class ChatResponse(BaseModel):
    """Chat response"""
    success: bool
    session_id: str
    messages: List[Dict]
    is_processing: bool


# API Endpoints
@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "Proxi MCP Server",
        "status": "operational",
        "current_mode": policy_engine.get_current_mode(),
        "policy_engine": "active",
        "version": "2.0.0",
        "chatbot_status": "ready"
    }


@app.get("/policy/status")
async def get_policy_status():
    """Get current policy configuration and status."""
    return {
        "current_mode": policy_engine.get_current_mode(),
        "allowed_tools": policy_engine.get_allowed_tools(),
        "blocked_tools": policy_engine.get_blocked_tools(),
        "summary": policy_engine.get_policy_summary()
    }


@app.post("/policy/set-mode")
async def set_mode(request: ModeChangeRequest):
    """Change the operational mode (NORMAL or EMERGENCY)."""
    try:
        policy_engine.set_mode(request.mode)
        return {
            "success": True,
            "new_mode": request.mode,
            "allowed_tools": policy_engine.get_allowed_tools()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/tools/execute", response_model=ToolResponse)
async def execute_tool(request: ToolRequest):
    """Execute a tool with policy enforcement."""
    tool_name = request.tool_name
    arguments = request.arguments
    context = request.context
    
    print(f"\n🔧 Tool execution request: {tool_name}")
    print(f"   Arguments: {arguments}")
    print(f"   Current mode: {policy_engine.get_current_mode()}")
    
    # Validate against policy
    try:
        policy_engine.validate(tool_name, arguments, context)
    except PolicyViolationError as e:
        print(f"   ❌ BLOCKED by policy: {e.reason}")
        return ToolResponse(
            success=False,
            policy_violation=True,
            blocked_reason=str(e),
            error=f"Policy violation: {e.reason}"
        )
    
    # Execute the tool
    try:
        result = _execute_tool_function(tool_name, arguments)
        print(f"   ✓ Execution completed successfully")
        return ToolResponse(
            success=True,
            result=result
        )
    except Exception as e:
        print(f"   ❌ Execution error: {str(e)}")
        return ToolResponse(
            success=False,
            error=f"Execution error: {str(e)}"
        )


def _execute_tool_function(tool_name: str, arguments: Dict[str, Any]) -> Any:
    """Route tool execution to the appropriate function."""
    tool_map = {
        "get_service_status": get_service_status,
        "read_logs": read_logs,
        "restart_service": restart_service,
        "scale_fleet": scale_fleet,
        "delete_database": delete_database,
        "list_services": list_services
    }
    
    if tool_name not in tool_map:
        raise ValueError(f"Unknown tool: {tool_name}")
    
    tool_function = tool_map[tool_name]
    
    try:
        result = tool_function(**arguments)
        return result
    except TypeError as e:
        raise ValueError(f"Invalid arguments for {tool_name}: {str(e)}")


# ============================================================================
# CHATBOT API - Store and Retrieve Responses
# ============================================================================

@app.post("/chat/send", response_model=ChatResponse)
async def send_chat_message(request: ChatMessage, background_tasks: BackgroundTasks):
    """
    Send a message to the chatbot.
    The chatbot processes in the background and stores the response.
    """
    session_id = request.session_id
    message = request.message
    
    # Check if already processing
    if conversation_store.is_task_active(session_id):
        raise HTTPException(
            status_code=429, 
            detail="Chatbot is currently processing another message. Please wait."
        )
    
    # Add user message to conversation
    conversation_store.add_message(session_id, "user", message)
    
    # Start chatbot processing in background
    background_tasks.add_task(process_chatbot_task, session_id, message)
    
    return ChatResponse(
        success=True,
        session_id=session_id,
        messages=conversation_store.get_conversation(session_id),
        is_processing=True
    )


@app.get("/chat/messages/{session_id}", response_model=ChatResponse)
async def get_chat_messages(session_id: str):
    """
    Get all messages for a conversation session.
    Frontend calls this to retrieve chatbot responses.
    """
    return ChatResponse(
        success=True,
        session_id=session_id,
        messages=conversation_store.get_conversation(session_id),
        is_processing=conversation_store.is_task_active(session_id)
    )


@app.delete("/chat/messages/{session_id}")
async def clear_chat_messages(session_id: str):
    """Clear all messages for a session."""
    conversation_store.clear_conversation(session_id)
    return {
        "success": True,
        "session_id": session_id,
        "message": "Conversation cleared"
    }


@app.get("/chat/status/{session_id}")
async def get_chat_status(session_id: str):
    """Check if chatbot is currently processing."""
    return {
        "session_id": session_id,
        "is_processing": conversation_store.is_task_active(session_id),
        "message_count": len(conversation_store.get_conversation(session_id))
    }


async def process_chatbot_task(session_id: str, user_message: str):
    """
    Process chatbot task in background.
    This is where the actual AI agent work happens.
    """
    from src.agent.bot import ProxiAgent
    
    try:
        # Mark task as active
        conversation_store.set_task_active(session_id, True)
        
        # Add "thinking" message
        conversation_store.add_message(
            session_id, 
            "system", 
            "Agent is processing your request...",
            {"thinking": True}
        )
        
        # Simulate some processing time
        await asyncio.sleep(1)
        
        # Initialize and run agent
        agent = ProxiAgent(use_mock=True)
        result = agent.run(user_message)
        
        # Remove thinking message
        messages = conversation_store.get_conversation(session_id)
        conversation_store.conversations[session_id] = [
            msg for msg in messages if not msg.get("metadata", {}).get("thinking")
        ]
        
        # Add agent response
        conversation_store.add_message(
            session_id,
            "agent",
            result.get("response", "Task completed."),
            {
                "success": result.get("success", True),
                "tool_used": result.get("tool_used"),
                "blocked": result.get("blocked", False)
            }
        )
        
    except Exception as e:
        print(f"Error in chatbot task: {e}")
        # Remove thinking message
        messages = conversation_store.get_conversation(session_id)
        conversation_store.conversations[session_id] = [
            msg for msg in messages if not msg.get("metadata", {}).get("thinking")
        ]
        
        # Add error message
        conversation_store.add_message(
            session_id,
            "agent",
            f"Error processing request: {str(e)}",
            {"error": True}
        )
    finally:
        # Mark task as complete
        conversation_store.set_task_active(session_id, False)


# ============================================================================
# Infrastructure Endpoints
# ============================================================================

@app.get("/infrastructure/status")
async def get_infrastructure_status():
    """Get current infrastructure status."""
    return {
        "services": cloud_infra.services,
        "fleet_size": cloud_infra.fleet_size,
        "recent_actions": cloud_infra.execution_log[-10:]
    }


@app.post("/infrastructure/simulate-incident")
async def simulate_incident(service: str, status: str = "critical"):
    """Simulate a service incident for demo purposes."""
    cloud_infra.set_service_health(service, status)
    return {
        "success": True,
        "message": f"Simulated incident: {service} set to {status}"
    }


@app.get("/tools/catalog")
async def get_tool_catalog():
    """Get catalog of available tools with descriptions."""
    return {
        "tools": [
            {
                "name": "list_services",
                "description": "List all available cloud services",
                "parameters": {},
                "category": "read-only"
            },
            {
                "name": "get_service_status",
                "description": "Get the current health status of cloud services",
                "parameters": {
                    "service_name": {
                        "type": "string",
                        "description": "Specific service to check (optional)",
                        "required": False
                    }
                },
                "category": "read-only"
            },
            {
                "name": "read_logs",
                "description": "Read recent system logs",
                "parameters": {
                    "lines": {
                        "type": "integer",
                        "description": "Number of log lines to retrieve",
                        "default": 10
                    }
                },
                "category": "read-only"
            },
            {
                "name": "restart_service",
                "description": "Restart a cloud service (EMERGENCY mode only)",
                "parameters": {
                    "service_name": {
                        "type": "string",
                        "description": "Name of the service to restart",
                        "required": True
                    }
                },
                "category": "active"
            },
            {
                "name": "scale_fleet",
                "description": "Scale the number of service instances (EMERGENCY mode only)",
                "parameters": {
                    "count": {
                        "type": "integer",
                        "description": "Target number of instances",
                        "required": True
                    }
                },
                "category": "active"
            },
            {
                "name": "delete_database",
                "description": "Delete a database (ALWAYS BLOCKED)",
                "parameters": {
                    "db_name": {
                        "type": "string",
                        "description": "Name of the database",
                        "required": True
                    }
                },
                "category": "destructive"
            }
        ],
        "current_mode": policy_engine.get_current_mode(),
        "allowed_in_current_mode": policy_engine.get_allowed_tools()
    }


if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*70)
    print("  PROXI MCP SERVER - Context-Aware Cloud Guardian")
    print("  Version 2.0.0 with Chatbot Response Storage")
    print("="*70)
    print(policy_engine.get_policy_summary())
    print("\nChatbot API Endpoints:")
    print("  POST   /chat/send              - Send message to chatbot")
    print("  GET    /chat/messages/{id}     - Get conversation messages")
    print("  DELETE /chat/messages/{id}     - Clear conversation")
    print("  GET    /chat/status/{id}       - Check processing status")
    print("\nStarting server on http://localhost:8000")
    print("API docs available at http://localhost:8000/docs")
    print("="*70 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)