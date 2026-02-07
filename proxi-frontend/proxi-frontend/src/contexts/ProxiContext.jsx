/**
 * Proxi Context - Global State Management with Chatbot Integration
 * 
 * Polls the chatbot API to retrieve responses when processing is complete
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { policyAPI, infrastructureAPI, toolsAPI, chatAPI, healthAPI } from '../services/api';

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
  const [quickActions, setQuickActions] = useState([]);

  // App config from backend (no hardcoding)
  const [appConfig, setAppConfig] = useState(null);
  const [maxFleetSize, setMaxFleetSize] = useState(10);

  // Agent State
  const [agentMessages, setAgentMessages] = useState([]);
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [sessionId] = useState('default'); // Session ID for chat

  // Loading and Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Polling control
  const pollingIntervalRef = useRef(null);

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
      setMaxFleetSize(data.max_fleet_size ?? 10);
      setRecentActions(data.recent_actions || []);
    } catch (err) {
      console.error('Failed to load infrastructure status:', err);
    }
  }, []);

  /**
   * Load tool catalog and quick actions from backend
   */
  const loadToolCatalog = useCallback(async () => {
    try {
      const data = await toolsAPI.getCatalog();
      setToolCatalog(data.tools || []);
      setQuickActions(data.quick_actions || []);
    } catch (err) {
      console.error('Failed to load tool catalog:', err);
    }
  }, []);

  /**
   * Load chatbot messages from backend
   */
  const loadChatMessages = useCallback(async () => {
    try {
      const data = await chatAPI.getMessages(sessionId);
      
      // Convert backend format to frontend format (include steps for flow display)
      const formattedMessages = data.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp).getTime(),
        toolUsed: msg.metadata?.tool_used,
        blocked: msg.metadata?.blocked || false,
        error: msg.metadata?.error || false,
        steps: msg.metadata?.steps || [],
      }));
      
      setAgentMessages(formattedMessages);
      setIsAgentThinking(data.is_processing);
      
      return data.is_processing;
    } catch (err) {
      console.error('Failed to load chat messages:', err);
      return false;
    }
  }, [sessionId]);

  /**
   * Start polling for chat updates
   */
  const startPolling = useCallback(() => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Poll every 1 second while processing
    pollingIntervalRef.current = setInterval(async () => {
      const isProcessing = await loadChatMessages();
      
      // Stop polling if not processing
      if (!isProcessing && pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }, 1000);
  }, [loadChatMessages]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  /**
   * Load app config from backend (title, tagline, features)
   */
  const loadAppConfig = useCallback(async () => {
    try {
      const data = await healthAPI.check();
      setAppConfig({
        app_name: data.app_name,
        tagline: data.tagline,
        footer_title: data.footer_title,
        footer_line: data.footer_line,
        features: data.features || [],
        policy_card_title: data.policy_card_title,
        policy_card_subtitle: data.policy_card_subtitle,
        infra_card_title: data.infra_card_title,
        infra_card_subtitle: data.infra_card_subtitle,
        tools_card_title: data.tools_card_title,
        tools_card_subtitle: data.tools_card_subtitle,
        chat_card_title: data.chat_card_title,
        chat_card_subtitle: data.chat_card_subtitle,
        chat_empty_title: data.chat_empty_title,
        chat_empty_subtitle: data.chat_empty_subtitle,
        chat_thinking: data.chat_thinking,
        chat_placeholder: data.chat_placeholder,
        chat_tip: data.chat_tip,
        tools_card_tip: data.tools_card_tip,
      });
    } catch (err) {
      console.error('Failed to load app config:', err);
    }
  }, []);

  /**
   * Initialize app - load all data from backend
   */
  const initialize = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        loadAppConfig(),
        loadPolicyStatus(),
        loadInfrastructureStatus(),
        loadToolCatalog(),
        loadChatMessages(),
      ]);
    } catch (err) {
      setError('Failed to initialize application');
    } finally {
      setLoading(false);
    }
  }, [loadAppConfig, loadPolicyStatus, loadInfrastructureStatus, loadToolCatalog, loadChatMessages]);

  /**
   * Change operational mode
   */
  const changeMode = useCallback(async (mode) => {
    try {
      await policyAPI.setMode(mode);
      await loadPolicyStatus();
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
      // Refresh infrastructure after tool execution
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
    } catch (err) {
      console.error('Failed to simulate incident:', err);
    }
  }, [loadInfrastructureStatus]);

  /**
   * Send message to chatbot
   */
  const sendAgentMessage = useCallback(async (message) => {
    try {
      // Send message to backend
      await chatAPI.sendMessage(message, sessionId);
      
      // Immediately load messages (will include user message and "thinking" status)
      await loadChatMessages();
      
      // Start polling for updates
      startPolling();
      
    } catch (err) {
      console.error('Failed to send agent message:', err);
      setAgentMessages(prev => [...prev, {
        role: 'agent',
        content: `Error: ${err.message}`,
        timestamp: Date.now(),
        error: true,
      }]);
    }
  }, [sessionId, loadChatMessages, startPolling]);

  /**
   * Clear agent conversation
   */
  const clearAgentMessages = useCallback(async () => {
    try {
      await chatAPI.clearMessages(sessionId);
      setAgentMessages([]);
      stopPolling();
    } catch (err) {
      console.error('Failed to clear messages:', err);
    }
  }, [sessionId, stopPolling]);

  // Initialize on mount
  useEffect(() => {
    initialize();
    
    // Cleanup polling on unmount
    return () => {
      stopPolling();
    };
  }, [initialize, stopPolling]);

  // Auto-refresh infrastructure status every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadInfrastructureStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [loadInfrastructureStatus]);

  const value = {
    // App config (from backend)
    appConfig,
    // Policy
    policyStatus,
    currentMode,
    allowedTools,
    blockedTools,
    changeMode,
    // Infrastructure
    services,
    fleetSize,
    maxFleetSize,
    recentActions,
    simulateIncident,
    // Tools
    toolCatalog,
    quickActions,
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