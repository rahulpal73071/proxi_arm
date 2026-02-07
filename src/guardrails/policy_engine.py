"""
Unified Policy Engine - Proxi Guardian

Features:
1. Scalpel Protocol: JIT least privilege (scope-locked escalation)
2. Shadow Mode: Pre-flight impact simulation
3. Cinderella Protocol: Time-bounded auto-expiring permissions
"""

import json
import time
import threading
from typing import Dict, Any, List, Set, Optional, Callable
from pathlib import Path
from datetime import datetime, timedelta


class PolicyViolationError(Exception):
    """Raised when an action violates security policy."""
    
    def __init__(self, message: str, tool_name: str, mode: str, reason: str):
        self.tool_name = tool_name
        self.mode = mode
        self.reason = reason
        super().__init__(message)


class TemporaryPermissionManager:
    """
    CINDERELLA PROTOCOL: Time-bounded auto-expiring permissions.
    Grants temporary emergency access that automatically revokes.
    """
    
    def __init__(self):
        self.is_active = False
        self.expiry_time: Optional[datetime] = None
        self.timer: Optional[threading.Timer] = None
        self.lock = threading.Lock()
        self.on_expiry_callback: Optional[Callable] = None
        
    def grant(self, duration_seconds: int, on_expiry: Optional[Callable] = None) -> None:
        """Grant temporary EMERGENCY permission."""
        with self.lock:
            if self.timer:
                self.timer.cancel()
            
            self.is_active = True
            self.expiry_time = datetime.now() + timedelta(seconds=duration_seconds)
            self.on_expiry_callback = on_expiry
            
            self.timer = threading.Timer(duration_seconds, self._expire)
            self.timer.daemon = True
            self.timer.start()
            
            print(f"\n⏰ CINDERELLA: Temporary permission granted for {duration_seconds}s")
            print(f"   Expires at: {self.expiry_time.strftime('%H:%M:%S')}")
    
    def _expire(self) -> None:
        """Auto-expire permissions."""
        with self.lock:
            self.is_active = False
            self.expiry_time = None
            self.timer = None
            
            print(f"\n🕛 CINDERELLA: Permission expired - reverted to base mode")
            
            if self.on_expiry_callback:
                self.on_expiry_callback()
    
    def revoke(self) -> None:
        """Manually revoke permissions."""
        with self.lock:
            if self.timer:
                self.timer.cancel()
                self.timer = None
            
            self.is_active = False
            self.expiry_time = None
            print(f"\n🛑 CINDERELLA: Permission manually revoked")
    
    def is_valid(self) -> bool:
        """Check if permission is still valid."""
        with self.lock:
            return self.is_active and (
                self.expiry_time is None or datetime.now() < self.expiry_time
            )
    
    def remaining_time(self) -> Optional[float]:
        """Get remaining time in seconds."""
        with self.lock:
            if not self.is_active or self.expiry_time is None:
                return None
            
            remaining = (self.expiry_time - datetime.now()).total_seconds()
            return max(0, remaining)
    
    def extend(self, additional_seconds: int) -> None:
        """Extend current permission."""
        with self.lock:
            if not self.is_active:
                return
            
            remaining = self.remaining_time() or 0
            new_duration = int(remaining + additional_seconds)
            
            if self.timer:
                self.timer.cancel()
            
            self.expiry_time = datetime.now() + timedelta(seconds=new_duration)
            self.timer = threading.Timer(new_duration, self._expire)
            self.timer.daemon = True
            self.timer.start()
            
            print(f"\n⏰ CINDERELLA: Extended by {additional_seconds}s (total: {new_duration}s)")


class PolicyEngine:
    """
    Unified Policy Engine with three protocols:
    
    1. SCALPEL: JIT least privilege - only modify affected services
    2. SHADOW: Pre-flight impact simulation
    3. CINDERELLA: Time-bounded auto-expiring permissions
    """
    
    def __init__(self, policy_path: str):
        self.policy_path = Path(policy_path)
        self.policy = self._load_policy()
        self.current_mode = "NORMAL"
        self.base_mode = "NORMAL"
        
        # SCALPEL: Track unhealthy services (scope-locked escalation)
        self.unhealthy_services: Set[str] = set()
        self.incident_scope: Dict[str, Any] = {}  # Current incident context
        
        # CINDERELLA: Time-bounded permissions
        self.temp_permission = TemporaryPermissionManager()
        
        # SHADOW: Execution history for traceability
        self.execution_history: List[Dict[str, Any]] = []
        
    def _load_policy(self) -> Dict[str, Any]:
        """Load policy configuration."""
        if not self.policy_path.exists():
            raise FileNotFoundError(f"Policy file not found: {self.policy_path}")
        
        with open(self.policy_path, 'r') as f:
            policy = json.load(f)
        
        print(f"✓ Loaded policy: {policy.get('policy_name', 'Unknown')} v{policy.get('version', '?')}")
        return policy
    
    def set_mode(self, mode: str) -> None:
        """Change operational mode permanently."""
        if mode not in self.policy['modes']:
            raise ValueError(f"Invalid mode: {mode}")
        
        if self.temp_permission.is_valid():
            self.temp_permission.revoke()
        
        self.current_mode = mode
        self.base_mode = mode
        print(f"\n🔄 Mode changed to: {mode}")
    
    # ==================== CINDERELLA PROTOCOL ====================
    
    def grant_temporary_emergency(self, duration_seconds: int = 10, reason: str = "") -> None:
        """CINDERELLA: Grant time-bounded emergency access."""
        self.base_mode = self.current_mode
        self.current_mode = "EMERGENCY"
        
        def on_expiry():
            self.current_mode = self.base_mode
            self.incident_scope = {}  # Clear incident scope
        
        self.temp_permission.grant(duration_seconds, on_expiry)
        
        self.execution_history.append({
            "timestamp": datetime.now().isoformat(),
            "action": "grant_temporary_emergency",
            "duration": duration_seconds,
            "reason": reason
        })
    
    def extend_temporary_emergency(self, additional_seconds: int = 10) -> None:
        """CINDERELLA: Extend current temporary permission."""
        if not self.temp_permission.is_valid():
            raise ValueError("No active temporary permission to extend")
        
        self.temp_permission.extend(additional_seconds)
        
        self.execution_history.append({
            "timestamp": datetime.now().isoformat(),
            "action": "extend_temporary_emergency",
            "additional_seconds": additional_seconds
        })
    
    def revoke_temporary_emergency(self) -> None:
        """CINDERELLA: Manually revoke temporary permission."""
        self.temp_permission.revoke()
        self.current_mode = self.base_mode
        self.incident_scope = {}
    
    def get_temporary_status(self) -> Dict[str, Any]:
        """Get CINDERELLA protocol status."""
        return {
            "is_active": self.temp_permission.is_valid(),
            "remaining_seconds": self.temp_permission.remaining_time(),
            "base_mode": self.base_mode,
            "current_mode": self.current_mode,
            "expiry_time": self.temp_permission.expiry_time.isoformat() if self.temp_permission.expiry_time else None
        }
    
    # ==================== SCALPEL PROTOCOL ====================
    
    def set_incident_scope(self, affected_services: List[str], incident_type: str, reason: str) -> None:
        """
        SCALPEL: Define scope of current incident.
        Only these specific services can be modified.
        """
        self.incident_scope = {
            "affected_services": set(affected_services),
            "incident_type": incident_type,
            "reason": reason,
            "timestamp": datetime.now().isoformat()
        }
        
        # Register as unhealthy
        for service in affected_services:
            self.unhealthy_services.add(service)
        
        print(f"\n🎯 SCALPEL: Incident scope locked")
        print(f"   Affected services: {', '.join(affected_services)}")
        print(f"   Type: {incident_type}")
        print(f"   Reason: {reason}")
        
        self.execution_history.append({
            "timestamp": datetime.now().isoformat(),
            "action": "set_incident_scope",
            "affected_services": affected_services,
            "incident_type": incident_type,
            "reason": reason
        })
    
    def clear_incident_scope(self) -> None:
        """SCALPEL: Clear incident scope."""
        self.incident_scope = {}
        print("\n🎯 SCALPEL: Incident scope cleared")
    
    def register_unhealthy_service(self, service_name: str) -> None:
        """SCALPEL: Mark service as unhealthy."""
        self.unhealthy_services.add(service_name)
        print(f"⚠️  SCALPEL: Registered unhealthy - {service_name}")
    
    def mark_service_healthy(self, service_name: str) -> None:
        """SCALPEL: Mark service as recovered."""
        self.unhealthy_services.discard(service_name)
        print(f"✓ SCALPEL: Service healthy - {service_name}")
    
    # ==================== VALIDATION ====================
    
    def validate(self, tool_name: str, args: Dict[str, Any] = None, 
                 context: Dict[str, Any] = None, shadow_mode: bool = False) -> bool:
        """
        Validate tool execution against all three protocols.
        
        Args:
            tool_name: Tool to execute
            args: Tool arguments
            context: Additional context
            shadow_mode: If True, this is a simulation (SHADOW protocol)
        """
        args = args or {}
        context = context or {}
        
        # Record validation attempt
        validation_record = {
            "timestamp": datetime.now().isoformat(),
            "tool_name": tool_name,
            "args": args,
            "mode": self.current_mode,
            "shadow_mode": shadow_mode
        }
        
        # Check global blocks
        if tool_name in self.policy['global_rules']['always_blocked']:
            validation_record["result"] = "BLOCKED_GLOBAL"
            self.execution_history.append(validation_record)
            
            raise PolicyViolationError(
                f"'{tool_name}' is globally blocked - destructive operation",
                tool_name=tool_name,
                mode=self.current_mode,
                reason="Globally blocked"
            )
        
        mode_policy = self.policy['modes'][self.current_mode]
        
        # Check mode-level blocks
        if tool_name in mode_policy['blocked_tools']:
            validation_record["result"] = "BLOCKED_MODE"
            self.execution_history.append(validation_record)
            
            raise PolicyViolationError(
                f"'{tool_name}' blocked in {self.current_mode} mode",
                tool_name=tool_name,
                mode=self.current_mode,
                reason=mode_policy.get('rationale', 'Blocked in current mode')
            )
        
        # Check whitelist
        if tool_name not in mode_policy['allowed_tools']:
            validation_record["result"] = "NOT_WHITELISTED"
            self.execution_history.append(validation_record)
            
            raise PolicyViolationError(
                f"'{tool_name}' not whitelisted for {self.current_mode} mode",
                tool_name=tool_name,
                mode=self.current_mode,
                reason="Not in allowed tools"
            )
        
        # SCALPEL PROTOCOL: Check service-specific constraints
        if self._is_modification_tool(tool_name):
            service_name = args.get('service_name')
            
            if not service_name:
                validation_record["result"] = "MISSING_SERVICE"
                self.execution_history.append(validation_record)
                
                raise PolicyViolationError(
                    f"'{tool_name}' requires service_name parameter",
                    tool_name=tool_name,
                    mode=self.current_mode,
                    reason="Missing service target"
                )
            
            # In EMERGENCY mode, check SCALPEL constraints
            if self.current_mode == "EMERGENCY":
                restrictions = mode_policy.get('service_restrictions', {})
                
                if restrictions.get('enabled', False):
                    # Check if service is unhealthy
                    if service_name not in self.unhealthy_services:
                        validation_record["result"] = "SERVICE_HEALTHY"
                        self.execution_history.append(validation_record)
                        
                        raise PolicyViolationError(
                            f"SCALPEL: Cannot modify '{service_name}' - service is healthy. "
                            f"Only unhealthy services can be modified: {list(self.unhealthy_services)}",
                            tool_name=tool_name,
                            mode=self.current_mode,
                            reason="Service not unhealthy"
                        )
                    
                    # Check incident scope if defined
                    if self.incident_scope:
                        affected = self.incident_scope.get('affected_services', set())
                        if service_name not in affected:
                            validation_record["result"] = "OUT_OF_SCOPE"
                            self.execution_history.append(validation_record)
                            
                            raise PolicyViolationError(
                                f"SCALPEL: '{service_name}' is out of incident scope. "
                                f"Current incident affects: {list(affected)}",
                                tool_name=tool_name,
                                mode=self.current_mode,
                                reason="Service not in incident scope"
                            )
        
        # Validation passed
        validation_record["result"] = "ALLOWED"
        self.execution_history.append(validation_record)
        
        # Show active protocol status
        if self.temp_permission.is_valid():
            remaining = self.temp_permission.remaining_time()
            print(f"  ⏰ CINDERELLA: {remaining:.1f}s remaining")
        
        if self.incident_scope:
            print(f"  🎯 SCALPEL: Scope - {list(self.incident_scope.get('affected_services', []))}")
        
        if shadow_mode:
            print(f"  🔮 SHADOW: Simulation mode - no real execution")
        
        print(f"  ✓ Policy OK: {tool_name} for {args.get('service_name', 'N/A')}")
        return True
    
    def _is_modification_tool(self, tool_name: str) -> bool:
        """Check if tool modifies system state."""
        modification_tools = ['restart_service', 'scale_fleet', 'delete_database']
        return tool_name in modification_tools
    
    # ==================== STATUS & REPORTING ====================
    
    def get_current_mode(self) -> str:
        return self.current_mode
    
    def get_allowed_tools(self) -> List[str]:
        return self.policy['modes'][self.current_mode]['allowed_tools']
    
    def get_blocked_tools(self) -> List[str]:
        return self.policy['modes'][self.current_mode]['blocked_tools']
    
    def get_execution_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent execution history for traceability."""
        return self.execution_history[-limit:]
    
    def get_policy_summary(self) -> str:
        """Human-readable policy status."""
        mode_info = self.policy['modes'][self.current_mode]
        
        temp_info = ""
        if self.temp_permission.is_valid():
            remaining = self.temp_permission.remaining_time()
            temp_info = f"\n║  ⏰ CINDERELLA: {remaining:.1f}s remaining                    ║"
        
        scope_info = ""
        if self.incident_scope:
            affected = ', '.join(list(self.incident_scope.get('affected_services', [])))
            scope_info = f"\n║  🎯 SCALPEL: {affected:<46}║"
        
        unhealthy_info = ""
        if self.unhealthy_services:
            unhealthy_info = f"\n║  ⚠️  Unhealthy: {', '.join(list(self.unhealthy_services)[:3]):<42}║"
        
        return f"""
╔════════════════════════════════════════════════════════════╗
║  UNIFIED POLICY ENGINE STATUS                              ║
╠════════════════════════════════════════════════════════════╣
║  Current Mode: {self.current_mode:<45}║
║  Base Mode:    {self.base_mode:<45}║{temp_info}{scope_info}{unhealthy_info}
╠════════════════════════════════════════════════════════════╣
║  {mode_info['description']:<57}║
╚════════════════════════════════════════════════════════════╝
"""
