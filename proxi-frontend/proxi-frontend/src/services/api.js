/**
 * API Service for Proxi Backend Communication
 * 
 * Includes chatbot API for sending messages and retrieving responses
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
 * Chatbot API - NEW: Communication with AI chatbot
 */
export const chatAPI = {
  // Send a message to the chatbot
  sendMessage: async (message, sessionId = 'default') => {
    const response = await api.post('/chat/send', {
      message: message,
      session_id: sessionId,
    });
    return response.data;
  },

  // Get all messages in a conversation
  getMessages: async (sessionId = 'default') => {
    const response = await api.get(`/chat/messages/${sessionId}`);
    return response.data;
  },

  // Clear conversation
  clearMessages: async (sessionId = 'default') => {
    const response = await api.delete(`/chat/messages/${sessionId}`);
    return response.data;
  },

  // Check if chatbot is processing
  getStatus: async (sessionId = 'default') => {
    const response = await api.get(`/chat/status/${sessionId}`);
    return response.data;
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