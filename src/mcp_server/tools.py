"""
Mock Cloud Infrastructure Tools

Simulates cloud infrastructure with realistic service management.
"""

from typing import Dict, Any, List
from datetime import datetime


class CloudInfrastructure:
    """Mock cloud infrastructure with service health tracking."""
    
    def __init__(self):
        self.services = {
            "web-server": "healthy",
            "api-gateway": "healthy",
            "database": "healthy",
            "cache": "healthy",
            "load-balancer": "healthy"
        }
        self.fleet_size = 3
        self.execution_log = []
    
    def list_services(self) -> Dict[str, Any]:
        """List all available services."""
        self._log_action("list_services", {})
        return {
            "services": list(self.services.keys()),
            "count": len(self.services),
            "timestamp": datetime.now().isoformat()
        }
    
    def _log_action(self, action: str, details: Dict[str, Any]) -> None:
        """Log infrastructure actions."""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "details": details
        }
        self.execution_log.append(log_entry)
        if len(self.execution_log) > 100:
            self.execution_log = self.execution_log[-100:]
    
    def set_service_health(self, service: str, status: str) -> None:
        """Set service health status."""
        if service in self.services:
            old_status = self.services[service]
            self.services[service] = status
            self._log_action("health_change", {
                "service": service,
                "old_status": old_status,
                "new_status": status
            })
    
    def get_unhealthy_services(self) -> List[str]:
        """Get list of unhealthy services."""
        return [
            name for name, health in self.services.items()
            if health in ["critical", "degraded"]
        ]
    
    def get_service_status(self, service_name: str = None) -> Dict[str, Any]:
        """Get service health status."""
        self._log_action("get_service_status", {"service": service_name})
        
        if service_name:
            if service_name not in self.services:
                return {
                    "status": "error",
                    "message": f"Service '{service_name}' not found",
                    "available_services": list(self.services.keys())
                }
            
            health = self.services[service_name]
            health_emoji = {
                "healthy": "✅",
                "degraded": "⚠️",
                "critical": "🔴"
            }.get(health, "❓")
            
            return {
                "service": service_name,
                "health": health,
                "status_emoji": health_emoji,
                "is_healthy": health == "healthy",
                "timestamp": datetime.now().isoformat()
            }
        else:
            unhealthy = self.get_unhealthy_services()
            return {
                "services": self.services,
                "fleet_size": self.fleet_size,
                "unhealthy_count": len(unhealthy),
                "unhealthy_services": unhealthy,
                "all_healthy": len(unhealthy) == 0,
                "timestamp": datetime.now().isoformat()
            }
    
    def read_logs(self, lines: int = 10) -> Dict[str, Any]:
        """Read system logs."""
        self._log_action("read_logs", {"lines": lines})
        
        log_entries = []
        for service, health in self.services.items():
            if health == "healthy":
                log_entries.append(f"[INFO] {service}: Operating normally")
            elif health == "degraded":
                log_entries.append(f"[WARN] {service}: Performance degraded")
            elif health == "critical":
                log_entries.append(f"[ERROR] {service}: Critical issues detected!")
        
        log_entries.extend([
            f"[INFO] Fleet: {self.fleet_size} instances active",
            f"[INFO] Total services: {len(self.services)}",
            f"[INFO] Execution log: {len(self.execution_log)} entries"
        ])
        
        return {
            "log_lines": log_entries[:lines],
            "timestamp": datetime.now().isoformat(),
            "total_available": len(log_entries)
        }
    
    def restart_service(self, service_name: str) -> Dict[str, Any]:
        """Restart a service."""
        self._log_action("restart_service", {"service": service_name})
        
        if service_name not in self.services:
            return {
                "status": "error",
                "message": f"Service '{service_name}' not found",
                "available_services": list(self.services.keys())
            }
        
        old_health = self.services[service_name]
        self.services[service_name] = "healthy"
        
        return {
            "status": "success",
            "service": service_name,
            "action": "restart",
            "old_health": old_health,
            "new_health": "healthy",
            "message": f"Service '{service_name}' restarted successfully",
            "timestamp": datetime.now().isoformat()
        }
    
    def scale_fleet(self, count: int) -> Dict[str, Any]:
        """Scale fleet size."""
        self._log_action("scale_fleet", {"target_count": count})
        
        if count < 1:
            return {"status": "error", "message": "Fleet size must be at least 1"}
        
        if count > 100:
            return {"status": "error", "message": "Fleet size cannot exceed 100"}
        
        old_size = self.fleet_size
        self.fleet_size = count
        
        return {
            "status": "success",
            "action": "scale",
            "old_size": old_size,
            "new_size": count,
            "change": count - old_size,
            "message": f"Fleet scaled from {old_size} to {count} instances",
            "timestamp": datetime.now().isoformat()
        }
    
    def delete_database(self, db_name: str) -> Dict[str, Any]:
        """Delete database (should never execute)."""
        self._log_action("delete_database_attempt", {"db_name": db_name})
        
        return {
            "status": "error",
            "message": "This operation should never execute - policy violation!",
            "db_name": db_name,
            "timestamp": datetime.now().isoformat()
        }


# Global instance
cloud_infra = CloudInfrastructure()


# Tool wrappers
def get_service_status(service_name: str = None) -> str:
    return str(cloud_infra.get_service_status(service_name))

def list_services() -> str:
    return str(cloud_infra.list_services())

def read_logs(lines: int = 10) -> str:
    return str(cloud_infra.read_logs(lines))

def restart_service(service_name: str) -> str:
    return str(cloud_infra.restart_service(service_name))

def scale_fleet(count: int) -> str:
    return str(cloud_infra.scale_fleet(count))

def delete_database(db_name: str) -> str:
    return str(cloud_infra.delete_database(db_name))
