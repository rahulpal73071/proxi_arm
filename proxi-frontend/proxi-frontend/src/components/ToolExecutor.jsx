/**
 * ToolExecutor Component
 * 
 * Interactive tool execution panel for testing policy enforcement.
 * Users can manually execute tools and see policy validation in action.
 */

import React, { useState } from 'react';
import { Terminal, Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useProxi } from '../contexts/ProxiContext';

const ToolExecutor = () => {
  const { toolCatalog, executeTool, allowedTools, currentMode } = useProxi();
  
  const [selectedTool, setSelectedTool] = useState('');
  const [toolArgs, setToolArgs] = useState({});
  const [executionResult, setExecutionResult] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleToolSelect = (toolName) => {
    setSelectedTool(toolName);
    setToolArgs({});
    setExecutionResult(null);
    
    // Initialize args for selected tool
    const tool = toolCatalog.find(t => t.name === toolName);
    if (tool && tool.parameters) {
      const initialArgs = {};
      Object.entries(tool.parameters).forEach(([key, param]) => {
        if (param.default !== undefined) {
          initialArgs[key] = param.default;
        }
      });
      setToolArgs(initialArgs);
    }
  };

  const handleArgChange = (argName, value) => {
    setToolArgs(prev => ({
      ...prev,
      [argName]: value
    }));
  };

  const handleExecute = async () => {
    if (!selectedTool) return;
    
    setIsExecuting(true);
    setExecutionResult(null);
    
    try {
      const result = await executeTool(selectedTool, toolArgs);
      setExecutionResult(result);
    } catch (error) {
      setExecutionResult({
        success: false,
        error: error.message,
        policy_violation: false
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const selectedToolInfo = toolCatalog.find(t => t.name === selectedTool);
  const isAllowed = allowedTools.includes(selectedTool);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-green-500 to-teal-500 text-white">
        <div className="flex items-center space-x-3">
          <Terminal className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Tool Executor</h2>
            <p className="text-sm opacity-90">Test Policy Enforcement</p>
          </div>
        </div>
      </div>

      {/* Tool Selection */}
      <div className="p-6 border-b">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Select Tool
        </label>
        <select
          value={selectedTool}
          onChange={(e) => handleToolSelect(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">-- Choose a tool --</option>
          {toolCatalog.map((tool) => (
            <option key={tool.name} value={tool.name}>
              {tool.name} ({tool.category})
            </option>
          ))}
        </select>
      </div>

      {/* Tool Details */}
      {selectedToolInfo && (
        <div className="p-6 border-b bg-gray-50">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-700 mb-1">{selectedToolInfo.name}</h3>
            <p className="text-sm text-gray-600">{selectedToolInfo.description}</p>
          </div>

          {/* Policy Status */}
          <div className="mb-4">
            {isAllowed ? (
              <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-sm text-green-800">
                  ✓ Allowed in {currentMode} mode
                </span>
              </div>
            ) : (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-sm text-red-800">
                  ✗ Blocked in {currentMode} mode
                </span>
              </div>
            )}
          </div>

          {/* Parameters */}
          {selectedToolInfo.parameters && Object.keys(selectedToolInfo.parameters).length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Parameters</h4>
              <div className="space-y-3">
                {Object.entries(selectedToolInfo.parameters).map(([argName, argInfo]) => (
                  <div key={argName}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {argName}
                      {argInfo.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type={argInfo.type === 'integer' ? 'number' : 'text'}
                      value={toolArgs[argName] || ''}
                      onChange={(e) => handleArgChange(argName, e.target.value)}
                      placeholder={argInfo.description}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">{argInfo.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Execute Button */}
      {selectedTool && (
        <div className="p-6 border-b">
          <button
            onClick={handleExecute}
            disabled={isExecuting}
            className={`w-full py-3 px-6 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all ${
              isExecuting
                ? 'bg-gray-400 cursor-not-allowed'
                : isAllowed
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            <Play className="w-5 h-5" />
            <span>
              {isExecuting ? 'Executing...' : isAllowed ? 'Execute Tool' : 'Try Execute (Will be blocked)'}
            </span>
          </button>
        </div>
      )}

      {/* Execution Result */}
      {executionResult && (
        <div className="p-6">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
            {executionResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            ) : executionResult.policy_violation ? (
              <XCircle className="w-5 h-5 text-red-500 mr-2" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
            )}
            Execution Result
          </h3>
          
          <div className={`p-4 rounded-lg border-l-4 ${
            executionResult.success
              ? 'bg-green-50 border-green-500'
              : executionResult.policy_violation
              ? 'bg-red-50 border-red-500'
              : 'bg-yellow-50 border-yellow-500'
          }`}>
            {executionResult.policy_violation && (
              <div className="mb-3">
                <div className="font-semibold text-red-800 mb-1">
                  🛡️ Policy Violation Detected
                </div>
                <div className="text-sm text-red-700">
                  {executionResult.blocked_reason}
                </div>
              </div>
            )}
            
            {executionResult.success && (
              <div>
                <div className="font-semibold text-green-800 mb-1">
                  ✓ Success
                </div>
                <pre className="text-xs bg-white p-3 rounded mt-2 overflow-x-auto">
                  {JSON.stringify(executionResult.result, null, 2)}
                </pre>
              </div>
            )}
            
            {executionResult.error && !executionResult.policy_violation && (
              <div>
                <div className="font-semibold text-red-800 mb-1">
                  ✗ Error
                </div>
                <div className="text-sm text-red-700">
                  {executionResult.error}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Footer */}
      <div className="px-6 py-4 bg-gray-50">
        <p className="text-xs text-gray-600 text-center">
          💡 Try executing blocked tools to see the Policy Engine in action
        </p>
      </div>
    </div>
  );
};

export default ToolExecutor;
