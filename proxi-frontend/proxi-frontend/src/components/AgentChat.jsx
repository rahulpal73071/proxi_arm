/**
 * AgentChat Component
 * 
 * Interactive chat interface for communicating with the Proxi AI agent.
 * Shows agent reasoning, tool usage, and policy enforcement.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Trash2, Loader } from 'lucide-react';
import { useProxi } from '../contexts/ProxiContext';

const AgentChat = () => {
  const { agentMessages, isAgentThinking, sendAgentMessage, clearAgentMessages, quickActions, appConfig } = useProxi();
  const chatTitle = appConfig?.chat_card_title ?? 'AI Agent Chat';
  const chatSubtitle = appConfig?.chat_card_subtitle ?? 'Talk to Proxi SRE';
  const emptyTitle = appConfig?.chat_empty_title ?? 'No messages yet';
  const emptySubtitle = appConfig?.chat_empty_subtitle ?? 'Start a conversation with the AI agent';
  const thinkingLabel = appConfig?.chat_thinking ?? 'Agent is thinking...';
  const placeholder = appConfig?.chat_placeholder ?? 'Ask the agent...';
  const chatTip = appConfig?.chat_tip ?? 'Try actions that might be blocked by policy';
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [agentMessages, isAgentThinking]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    
    sendAgentMessage(inputMessage);
    setInputMessage('');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bot className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">{chatTitle}</h2>
              <p className="text-sm opacity-90">{chatSubtitle}</p>
            </div>
          </div>
          
          {agentMessages.length > 0 && (
            <button
              onClick={clearAgentMessages}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions from backend */}
      {agentMessages.length === 0 && quickActions.length > 0 && (
        <div className="p-4 bg-gray-50 border-b">
          <p className="text-sm text-gray-600 mb-2">Quick Actions:</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => sendAgentMessage(action.message)}
                className="p-2 text-left text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-indigo-500 transition-all"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {agentMessages.length === 0 && (
          <div className="text-center text-gray-400 mt-12">
            <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold">{emptyTitle}</p>
            <p className="text-sm">{emptySubtitle}</p>
          </div>
        )}

        {agentMessages.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-indigo-500 text-white'
                  : message.role === 'system'
                  ? 'bg-yellow-100 text-yellow-900 border border-yellow-300'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role === 'agent' && <Bot className="w-5 h-5 mt-1" />}
                {message.role === 'user' && <User className="w-5 h-5 mt-1" />}
                <div className="flex-1">
                  {/* Step-by-step flow when available (from Gemini or mock) */}
                  {message.steps && message.steps.length > 0 && (
                    <div className="mb-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Steps</p>
                      {message.steps.map((step, i) => (
                        <div
                          key={i}
                          className={`text-sm rounded-lg p-2 border-l-4 ${
                            step.blocked
                              ? 'border-red-500 bg-red-50 text-red-900'
                              : 'border-indigo-500 bg-indigo-50/50 text-gray-800'
                          }`}
                        >
                          <span className="font-medium">Step {step.step_number}:</span>{' '}
                          <span className="opacity-90">{step.thought}</span>
                          <div className="mt-1 text-xs font-mono text-gray-600">
                            → {step.tool_name}
                            {step.tool_input && Object.keys(step.tool_input).length > 0 && (
                              <span> ({JSON.stringify(step.tool_input)})</span>
                            )}
                          </div>
                          {step.result && (
                            <div className="mt-1 text-xs text-gray-500 truncate max-w-full" title={step.result}>
                              {step.result.length > 120 ? step.result.slice(0, 120) + '…' : step.result}
                            </div>
                          )}
                          {step.blocked && (
                            <span className="inline-block mt-1 text-xs font-medium text-red-600">🛡️ Blocked by policy</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.toolUsed && !(message.steps && message.steps.length > 0) && (
                    <div className="mt-2 text-xs opacity-75">
                      🔧 Used tool: {message.toolUsed}
                    </div>
                  )}
                  {message.blocked && !(message.steps && message.steps.length > 0) && (
                    <div className="mt-2 text-xs bg-red-500 text-white px-2 py-1 rounded inline-block">
                      🛡️ Blocked by policy
                    </div>
                  )}
                  <div className="mt-1 text-xs opacity-60">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isAgentThinking && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Loader className="w-5 h-5 animate-spin" />
                <span className="text-sm">{thinkingLabel}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={placeholder}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={isAgentThinking}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isAgentThinking}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <Send className="w-5 h-5" />
            <span>Send</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">💡 {chatTip}</p>
      </form>
    </div>
  );
};

export default AgentChat;
