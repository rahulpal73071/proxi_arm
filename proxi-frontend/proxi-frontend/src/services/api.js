/**
 * API Service for Proxi Backend Communication
 * 
 * This service handles all HTTP requests to the FastAPI backend.
 * It uses axios with a base URL configuration for easy integration.
 */

import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api', // Proxied to http://localhost:8000 via Vite
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('[API] Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Policy API
 */
export const policyAPI = {
  // Get current policy status
  getStatus: async () => {
    const response = await api.get('/policy/status');
    return response.data;
  },

  // Set operational mode
  setMode: async (mode) => {
    const response = await api.post('/policy/set-mode', { mode });
    return response.data;
  },
};

/**
 * Tools API
 */
export const toolsAPI = {
  // Execute a tool
  execute: async (toolName, args = {}, context = {}) => {
    const response = await api.post('/tools/execute', {
      tool_name: toolName,
      arguments: args,
      context: context,
    });
    return response.data;
  },

  // Get tool catalog
  getCatalog: async () => {
    const response = await api.get('/tools/catalog');
    return response.data;
  },
};

/**
 * Infrastructure API
 */
export const infrastructureAPI = {
  // Get infrastructure status
  getStatus: async () => {
    const response = await api.get('/infrastructure/status');
    return response.data;
  },

  // Simulate an incident
  simulateIncident: async (service, status = 'critical') => {
    const response = await api.post('/infrastructure/simulate-incident', null, {
      params: { service, status },
    });
    return response.data;
  },
};

/**
 * Agent API (for future agent interaction)
 */
export const agentAPI = {
  // Send a task to the agent
  executeTask: async (task) => {
    // This would be implemented when backend supports direct agent API
    // For now, we'll use tool execution
    return { task, status: 'pending' };
  },
};

/**
 * Health Check
 */
export const healthAPI = {
  check: async () => {
    const response = await api.get('/');
    return response.data;
  },
};

export default api;
