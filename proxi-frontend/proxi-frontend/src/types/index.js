/**
 * Type definitions for Proxi application
 */

export const OperationalMode = {
  NORMAL: 'NORMAL',
  EMERGENCY: 'EMERGENCY',
};

export const ServiceHealth = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  CRITICAL: 'critical',
};

export const ToolCategory = {
  READ_ONLY: 'read-only',
  ACTIVE: 'active',
  DESTRUCTIVE: 'destructive',
};

// JSDoc type definitions for better IDE support

/**
 * @typedef {Object} PolicyStatus
 * @property {string} current_mode - Current operational mode
 * @property {string[]} allowed_tools - List of allowed tools
 * @property {string[]} blocked_tools - List of blocked tools
 * @property {string} summary - Policy summary text
 */

/**
 * @typedef {Object} ToolExecutionResult
 * @property {boolean} success - Whether execution succeeded
 * @property {*} result - Execution result
 * @property {string} [error] - Error message if failed
 * @property {boolean} policy_violation - Whether a policy violation occurred
 * @property {string} [blocked_reason] - Reason for blocking
 */

/**
 * @typedef {Object} Tool
 * @property {string} name - Tool name
 * @property {string} description - Tool description
 * @property {Object} parameters - Tool parameters
 * @property {string} category - Tool category
 */

/**
 * @typedef {Object} InfrastructureStatus
 * @property {Object.<string, string>} services - Service health status map
 * @property {number} fleet_size - Current fleet size
 * @property {Object[]} recent_actions - Recent infrastructure actions
 */

/**
 * @typedef {Object} AgentMessage
 * @property {string} role - 'user' or 'agent'
 * @property {string} content - Message content
 * @property {number} timestamp - Message timestamp
 * @property {string} [toolUsed] - Tool used (if any)
 * @property {boolean} [blocked] - Whether action was blocked
 */

export default {
  OperationalMode,
  ServiceHealth,
  ToolCategory,
};
