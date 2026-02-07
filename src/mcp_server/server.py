"""
Unified MCP Server with Three Protocols:
1. SCALPEL: JIT least privilege
2. SHADOW: Impact simulation
3. CINDERELLA: Time-bounded permissions
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.guardrails.policy_engine import PolicyEngine, PolicyViolationError
from src.guardrails.impact_simulator import ImpactSimulator
from src.mcp_server.tools import (
    cloud_infra, get_service_status, list_services,
    read_logs, restart_service, scale_fleet, delete_database
)

# Initialize app
app = FastAPI(
    title="Proxi Unified Guardian",
    description="AI Agent with SCALPEL, SHADOW, and CINDERELLA protocols",
    version="3.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
policy_path = Path(__file__).parent.parent.parent / "policies" / "ops_policy.json"
policy_engine = PolicyEngine(str(policy_path))
impact_simulator = ImpactSimulator()


# ==================== REQUEST/RESPONSE MODELS ====================

class ToolRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)
    execution_mode: str = Field(default="REAL", description="REAL or SHADOW")

class ToolResponse(BaseModel):
    success: bool
    result: Optional[Any] = None
    error: Optional[str] = None
    policy_violation: bool = False
    blocked_reason: Optional[str] = None
    shadow_report: Optional[Dict[str, Any]] = None
    execution_flow: Optional[List[Dict[str, Any]]] = None

class ModeChangeRequest(BaseModel):
    mode: str

class TemporaryPermissionRequest(BaseModel):
    duration_seconds: int = Field(default=10, ge=1, le=300)
    reason: str = Field(default="", description="Reason for emergency access")

class TemporaryExtensionRequest(BaseModel):
    additional_seconds: int = Field(default=10, ge=1, le=60)

class IncidentScopeRequest(BaseModel):
    affected_services: List[str]
    incident_type: str
    reason: str

class IncidentSimulation(BaseModel):
    service: str
    status: str = Field(default="critical")


# ==================== CORE ENDPOINTS ====================

@app.get("/")
async def root():
    """Health check with full system status."""
    temp_status = policy_engine.get_temporary_status()
    return {
        "service": "Proxi Unified Guardian v3.0",
        "status": "operational",
        "protocols": {
            "scalpel": "active",
            "shadow": "active",
            "cinderella": "active"
        },
        "current_mode": policy_engine.get_current_mode(),
        "base_mode": temp_status["base_mode"],
        "temporary_permission_active": temp_status["is_active"],
        "unhealthy_services": list(policy_engine.unhealthy_services),
        "incident_scope": policy_engine.incident_scope if policy_engine.incident_scope else None
    }


@app.get("/policy/status")
async def get_policy_status():
    """Get comprehensive policy status."""
    temp_status = policy_engine.get_temporary_status()
    return {
        "current_mode": policy_engine.get_current_mode(),
        "base_mode": temp_status["base_mode"],
        "allowed_tools": policy_engine.get_allowed_tools(),
        "blocked_tools": policy_engine.get_blocked_tools(),
        "protocols": {
            "cinderella": {
                "active": temp_status["is_active"],
                "remaining_seconds": temp_status["remaining_seconds"],
                "expiry_time": temp_status["expiry_time"]
            },
            "scalpel": {
                "unhealthy_services": list(policy_engine.unhealthy_services),
                "incident_scope": policy_engine.incident_scope if policy_engine.incident_scope else None
            }
        },
        "summary": policy_engine.get_policy_summary()
    }


# ==================== MODE MANAGEMENT ====================

@app.post("/policy/set-mode")
async def set_mode(request: ModeChangeRequest):
    """Change operational mode."""
    try:
        policy_engine.set_mode(request.mode)
        return {
            "success": True,
            "new_mode": request.mode,
            "allowed_tools": policy_engine.get_allowed_tools()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== CINDERELLA PROTOCOL ====================

@app.post("/policy/grant-temporary")
async def grant_temporary_permission(request: TemporaryPermissionRequest):
    """CINDERELLA: Grant time-bounded emergency access."""
    try:
        policy_engine.grant_temporary_emergency(
            request.duration_seconds,
            request.reason
        )
        
        return {
            "success": True,
            "protocol": "CINDERELLA",
            "message": f"Temporary EMERGENCY access granted for {request.duration_seconds}s",
            "duration_seconds": request.duration_seconds,
            "reason": request.reason,
            "current_mode": policy_engine.get_current_mode(),
            "base_mode": policy_engine.base_mode,
            "expiry_time": policy_engine.temp_permission.expiry_time.isoformat() if policy_engine.temp_permission.expiry_time else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/policy/extend-temporary")
async def extend_temporary_permission(request: TemporaryExtensionRequest):
    """CINDERELLA: Extend current temporary permission."""
    try:
        policy_engine.extend_temporary_emergency(request.additional_seconds)
        
        new_status = policy_engine.get_temporary_status()
        
        return {
            "success": True,
            "protocol": "CINDERELLA",
            "message": f"Permission extended by {request.additional_seconds}s",
            "additional_seconds": request.additional_seconds,
            "total_remaining_seconds": new_status["remaining_seconds"],
            "expiry_time": new_status["expiry_time"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/policy/revoke-temporary")
async def revoke_temporary_permission():
    """CINDERELLA: Revoke temporary permission."""
    try:
        policy_engine.revoke_temporary_emergency()
        
        return {
            "success": True,
            "protocol": "CINDERELLA",
            "message": "Temporary permission revoked",
            "current_mode": policy_engine.get_current_mode()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== SCALPEL PROTOCOL ====================

@app.post("/policy/set-incident-scope")
async def set_incident_scope(request: IncidentScopeRequest):
    """SCALPEL: Define incident scope for JIT least privilege."""
    try:
        policy_engine.set_incident_scope(
            request.affected_services,
            request.incident_type,
            request.reason
        )
        
        return {
            "success": True,
            "protocol": "SCALPEL",
            "message": "Incident scope locked",
            "affected_services": request.affected_services,
            "incident_type": request.incident_type,
            "reason": request.reason,
            "scope_details": policy_engine.incident_scope
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/policy/clear-incident-scope")
async def clear_incident_scope():
    """SCALPEL: Clear incident scope."""
    try:
        policy_engine.clear_incident_scope()
        
        return {
            "success": True,
            "protocol": "SCALPEL",
            "message": "Incident scope cleared"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== TOOL EXECUTION ====================

@app.post("/tools/execute", response_model=ToolResponse)
async def execute_tool(request: ToolRequest):
    """
    Execute tool with all three protocols:
    - SCALPEL: Service-specific validation
    - SHADOW: Impact simulation
    - CINDERELLA: Time-bounded permissions
    """
    tool_name = request.tool_name
    arguments = request.arguments
    context = request.context
    execution_mode = request.execution_mode.upper()
    
    # Execution flow tracking
    execution_flow = []
    execution_flow.append({
        "step": "request_received",
        "timestamp": cloud_infra._log_action.__globals__['datetime'].now().isoformat(),
        "tool": tool_name,
        "arguments": arguments,
        "mode": execution_mode
    })
    
    # Validate execution mode
    if execution_mode not in {"REAL", "SHADOW"}:
        raise HTTPException(status_code=400, detail="Invalid execution_mode. Use REAL or SHADOW.")
    
    # STEP 1: Handle status checks (updates unhealthy service tracking)
    if tool_name == "get_service_status":
        result = _execute_tool_function(tool_name, arguments)
        _update_unhealthy_services(arguments.get('service_name'), result)
        
        execution_flow.append({
            "step": "status_check_completed",
            "timestamp": cloud_infra._log_action.__globals__['datetime'].now().isoformat(),
            "unhealthy_services": list(policy_engine.unhealthy_services)
        })
        
        return ToolResponse(
            success=True,
            result=result,
            execution_flow=execution_flow
        )
    
    # STEP 2: SHADOW MODE - Impact simulation
    if execution_mode == "SHADOW":
        execution_flow.append({
            "step": "shadow_mode_simulation",
            "timestamp": cloud_infra._log_action.__globals__['datetime'].now().isoformat(),
            "message": "Generating impact report without execution"
        })
        
        impact_report = impact_simulator.simulate(tool_name, arguments, cloud_infra)
        
        execution_flow.append({
            "step": "impact_report_generated",
            "timestamp": cloud_infra._log_action.__globals__['datetime'].now().isoformat(),
            "risk_level": impact_report.get("risk_level"),
            "recommendation": impact_report.get("recommendation")
        })
        
        return ToolResponse(
            success=True,
            result={
                "mode": "SHADOW",
                "impact_report": impact_report,
                "note": "No real action executed - simulation only"
            },
            shadow_report=impact_report,
            execution_flow=execution_flow
        )
    
    # STEP 3: Policy validation (SCALPEL + CINDERELLA)
    execution_flow.append({
        "step": "policy_validation_start",
        "timestamp": cloud_infra._log_action.__globals__['datetime'].now().isoformat(),
        "current_mode": policy_engine.get_current_mode(),
        "unhealthy_services": list(policy_engine.unhealthy_services),
        "incident_scope": policy_engine.incident_scope if policy_engine.incident_scope else None
    })
    
    try:
        policy_engine.validate(tool_name, arguments, context, shadow_mode=False)
        
        execution_flow.append({
            "step": "policy_validation_passed",
            "timestamp": cloud_infra._log_action.__globals__['datetime'].now().isoformat(),
            "message": "All policy checks passed"
        })
        
    except PolicyViolationError as e:
        execution_flow.append({
            "step": "policy_validation_failed",
            "timestamp": cloud_infra._log_action.__globals__['datetime'].now().isoformat(),
            "reason": e.reason,
            "violation_type": str(type(e).__name__)
        })
        
        return ToolResponse(
            success=False,
            policy_violation=True,
            blocked_reason=str(e),
            error=f"Policy violation: {e.reason}",
            execution_flow=execution_flow
        )
    
    # STEP 4: Execute tool
    execution_flow.append({
        "step": "tool_execution_start",
        "timestamp": cloud_infra._log_action.__globals__['datetime'].now().isoformat()
    })
    
    try:
        result = _execute_tool_function(tool_name, arguments)
        
        execution_flow.append({
            "step": "tool_execution_completed",
            "timestamp": cloud_infra._log_action.__globals__['datetime'].now().isoformat(),
            "result": str(result)[:200]  # Truncate for flow
        })
        
        # Update service health if restart succeeded
        if tool_name == "restart_service" and "success" in str(result).lower():
            service_name = arguments.get('service_name')
            if service_name:
                policy_engine.mark_service_healthy(service_name)
                cloud_infra.set_service_health(service_name, "healthy")
                
                execution_flow.append({
                    "step": "service_health_updated",
                    "timestamp": cloud_infra._log_action.__globals__['datetime'].now().isoformat(),
                    "service": service_name,
                    "new_health": "healthy"
                })
        
        return ToolResponse(
            success=True,
            result=result,
            execution_flow=execution_flow
        )
        
    except Exception as e:
        execution_flow.append({
            "step": "tool_execution_failed",
            "timestamp": cloud_infra._log_action.__globals__['datetime'].now().isoformat(),
            "error": str(e)
        })
        
        return ToolResponse(
            success=False,
            error=f"Execution error: {str(e)}",
            execution_flow=execution_flow
        )


def _update_unhealthy_services(service_name: Optional[str], status_result: Any) -> None:
    """Update policy engine's unhealthy service tracking."""
    try:
        if service_name is None:
            for svc_name, health in cloud_infra.services.items():
                if health in ["critical", "degraded"]:
                    policy_engine.register_unhealthy_service(svc_name)
                elif health == "healthy":
                    policy_engine.mark_service_healthy(svc_name)
        else:
            health = cloud_infra.services.get(service_name, "unknown")
            if health in ["critical", "degraded"]:
                policy_engine.register_unhealthy_service(service_name)
            elif health == "healthy":
                policy_engine.mark_service_healthy(service_name)
    except Exception as e:
        print(f"Error updating unhealthy services: {e}")


def _execute_tool_function(tool_name: str, arguments: Dict[str, Any]) -> Any:
    """Route tool execution to appropriate function."""
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


# ==================== INFRASTRUCTURE MANAGEMENT ====================

@app.get("/infrastructure/status")
async def get_infrastructure_status():
    """Get infrastructure status."""
    return {
        "services": cloud_infra.services,
        "fleet_size": cloud_infra.fleet_size,
        "recent_actions": cloud_infra.execution_log[-10:],
        "policy_unhealthy_services": list(policy_engine.unhealthy_services)
    }


@app.post("/infrastructure/simulate-incident")
async def simulate_incident(request: IncidentSimulation):
    """Simulate service incident."""
    service = request.service
    status = request.status
    
    cloud_infra.set_service_health(service, status)
    
    if status in ["critical", "degraded"]:
        policy_engine.register_unhealthy_service(service)
    else:
        policy_engine.mark_service_healthy(service)
    
    return {
        "success": True,
        "message": f"Simulated: {service} set to {status}",
        "infrastructure_status": cloud_infra.services[service],
        "policy_tracking": service in policy_engine.unhealthy_services
    }


# ==================== HISTORY & TRACEABILITY ====================

@app.get("/execution/history")
async def get_execution_history(limit: int = 50):
    """Get execution history for traceability."""
    return {
        "history": policy_engine.get_execution_history(limit),
        "total_events": len(policy_engine.execution_history),
        "protocols_active": {
            "scalpel": bool(policy_engine.unhealthy_services or policy_engine.incident_scope),
            "cinderella": policy_engine.temp_permission.is_valid(),
            "shadow": True
        }
    }


@app.get("/tools/catalog")
async def get_tool_catalog():
    """Get tool catalog with descriptions."""
    return {
        "tools": [
            {
                "name": "list_services",
                "description": "List all cloud services",
                "category": "read-only",
                "parameters": {}
            },
            {
                "name": "get_service_status",
                "description": "Get service health status",
                "category": "read-only",
                "parameters": {"service_name": "optional"}
            },
            {
                "name": "read_logs",
                "description": "Read system logs",
                "category": "read-only",
                "parameters": {"lines": "integer, default 10"}
            },
            {
                "name": "restart_service",
                "description": "Restart service (EMERGENCY only, unhealthy services only)",
                "category": "active",
                "parameters": {"service_name": "required"},
                "restrictions": "SCALPEL: Only unhealthy services"
            },
            {
                "name": "scale_fleet",
                "description": "Scale fleet size (EMERGENCY only)",
                "category": "active",
                "parameters": {"count": "integer"}
            },
            {
                "name": "delete_database",
                "description": "Delete database (ALWAYS BLOCKED)",
                "category": "destructive",
                "parameters": {"db_name": "required"}
            }
        ],
        "current_mode": policy_engine.get_current_mode(),
        "allowed_in_current_mode": policy_engine.get_allowed_tools(),
        "unhealthy_services": list(policy_engine.unhealthy_services)
    }


if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*70)
    print("  PROXI UNIFIED GUARDIAN v3.0")
    print("  Protocols: SCALPEL | SHADOW | CINDERELLA")
    print("="*70)
    print(policy_engine.get_policy_summary())
    print("\nServer: http://localhost:8000")
    print("API Docs: http://localhost:8000/docs")
    print("="*70 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
