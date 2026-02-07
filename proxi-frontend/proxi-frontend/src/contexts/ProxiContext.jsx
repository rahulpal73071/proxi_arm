/**
 * Proxi Context - Global State Management
 * 
 * Provides policy status, infrastructure state, and agent interaction
 * across the entire application.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { policyAPI, infrastructureAPI, toolsAPI } from '../services/api';

const ProxiContext = createContext(null);

export const ProxiProvider = ({ children }) => {
  // Policy State
  const [policyStatus, setPolicyStatus] = useState(null);
  const [currentMode, setCurrentMode] = useState('NORMAL');
  const [allowedTools, setAllowedTools] = useState([]);
  const [blockedTools, setBlockedTools] = useState([]);

  // Infrastructure State
  const [services, setServices] = useState({});
  const [fleetSize, setFleetSize] = useState(0);
  const [recentActions, setRecentActions] = useState([]);

  // Tools State
  const [toolCatalog, setToolCatalog] = useState([]);

  // Agent State
  const [agentMessages, setAgentMessages] = useState([]);
  const [isAgentThinking, setIsAgentThinking] = useState(false);

  // Loading and Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Load policy status from backend
   */
  const loadPolicyStatus = useCallback(async () => {
    try {
      const data = await policyAPI.getStatus();
      setPolicyStatus(data);
      setCurrentMode(data.current_mode);
      setAllowedTools(data.allowed_tools || []);
      setBlockedTools(data.blocked_tools || []);
    } catch (err) {
      console.error('Failed to load policy status:', err);
      setError('Failed to connect to policy engine');
    }
  }, []);

  /**
   * Load infrastructure status
   */
  const loadInfrastructureStatus = useCallback(async () => {
    try {
      const data = await infrastructureAPI.getStatus();
      setServices(data.services || {});
      setFleetSize(data.fleet_size || 0);
      setRecentActions(data.recent_actions || []);
    } catch (err) {
      console.error('Failed to load infrastructure status:', err);
    }
  }, []);

  /**
   * Load tool catalog
   */
  const loadToolCatalog = useCallback(async () => {
    try {
      const data = await toolsAPI.getCatalog();
      setToolCatalog(data.tools || []);
    } catch (err) {
      console.error('Failed to load tool catalog:', err);
    }
  }, []);

  /**
   * Initialize app - load all data
   */
  const initialize = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        loadPolicyStatus(),
        loadInfrastructureStatus(),
        loadToolCatalog(),
      ]);
    } catch (err) {
      setError('Failed to initialize application');
    } finally {
      setLoading(false);
    }
  }, [loadPolicyStatus, loadInfrastructureStatus, loadToolCatalog]);

  /**
   * Change operational mode
   */
  const changeMode = useCallback(async (mode) => {
    try {
      await policyAPI.setMode(mode);
      await loadPolicyStatus();
      
      // Add system message
      setAgentMessages(prev => [...prev, {
        role: 'system',
        content: `Operational mode changed to ${mode}`,
        timestamp: Date.now(),
      }]);
      
      return true;
    } catch (err) {
      console.error('Failed to change mode:', err);
      setError(`Failed to change mode to ${mode}`);
      return false;
    }
  }, [loadPolicyStatus]);

  /**
   * Execute a tool
   */
  const executeTool = useCallback(async (toolName, args = {}) => {
    try {
      const result = await toolsAPI.execute(toolName, args);
      
      // Refresh infrastructure status after tool execution
      await loadInfrastructureStatus();
      
      return result;
    } catch (err) {
      console.error('Failed to execute tool:', err);
      throw err;
    }
  }, [loadInfrastructureStatus]);

  /**
   * Simulate incident
   */
  const simulateIncident = useCallback(async (service, status = 'critical') => {
    try {
      await infrastructureAPI.simulateIncident(service, status);
      await loadInfrastructureStatus();
      
      setAgentMessages(prev => [...prev, {
        role: 'system',
        content: `Simulated incident: ${service} is now ${status}`,
        timestamp: Date.now(),
      }]);
    } catch (err) {
      console.error('Failed to simulate incident:', err);
    }
  }, [loadInfrastructureStatus]);

  /**
   * Send message to agent (simulated for now)
   */
  const sendAgentMessage = useCallback(async (message) => {
    // Add user message
    setAgentMessages(prev => [...prev, {
      role: 'user',
      content: message,
      timestamp: Date.now(),
    }]);

    setIsAgentThinking(true);

    // Simulate agent thinking (in real implementation, this would call agent API)
    setTimeout(() => {
      setAgentMessages(prev => [...prev, {
        role: 'agent',
        content: 'I understand your request. Let me analyze the current infrastructure state and policy constraints...',
        timestamp: Date.now(),
      }]);
      setIsAgentThinking(false);
    }, 1500);
  }, []);

  /**
   * Clear agent conversation
   */
  const clearAgentMessages = useCallback(() => {
    setAgentMessages([]);
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Auto-refresh infrastructure status every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadInfrastructureStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [loadInfrastructureStatus]);

  const value = {
    // Policy
    policyStatus,
    currentMode,
    allowedTools,
    blockedTools,
    changeMode,

    // Infrastructure
    services,
    fleetSize,
    recentActions,
    simulateIncident,

    // Tools
    toolCatalog,
    executeTool,

    // Agent
    agentMessages,
    isAgentThinking,
    sendAgentMessage,
    clearAgentMessages,

    // Actions
    refresh: initialize,
    loadPolicyStatus,
    loadInfrastructureStatus,

    // State
    loading,
    error,
  };

  return (
    <ProxiContext.Provider value={value}>
      {children}
    </ProxiContext.Provider>
  );
};

/**
 * Hook to use Proxi context
 */
export const useProxi = () => {
  const context = useContext(ProxiContext);
  if (!context) {
    throw new Error('useProxi must be used within ProxiProvider');
  }
  return context;
};

export default ProxiContext;
