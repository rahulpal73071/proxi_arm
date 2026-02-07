/**
 * PolicyStatusCard Component
 * 
 * Displays current policy status, operational mode, and allowed/blocked tools.
 */

import React from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useProxi } from '../contexts/ProxiContext';

const PolicyStatusCard = () => {
  const { policyStatus, currentMode, allowedTools, blockedTools, changeMode, loading, appConfig } = useProxi();
  const modes = policyStatus?.modes || {};
  const policyTitle = appConfig?.policy_card_title ?? 'Policy Engine';
  const policySubtitle = appConfig?.policy_card_subtitle ?? 'Context-Aware Security';
  const modeNames = Object.keys(modes);
  const currentModeInfo = modes[currentMode] || {};
  const globalRules = policyStatus?.global_rules || {};
  const alwaysBlocked = globalRules.always_blocked || [];

  const isNormalMode = currentMode === 'NORMAL';
  const isEmergencyMode = currentMode === 'EMERGENCY';

  const handleModeToggle = async () => {
    const nextIndex = (modeNames.indexOf(currentMode) + 1) % Math.max(modeNames.length, 1);
    const newMode = modeNames[nextIndex] || modeNames[0];
    if (newMode) await changeMode(newMode);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className={`p-6 ${isNormalMode ? 'bg-blue-500' : 'bg-orange-500'} text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">{policyTitle}</h2>
              <p className="text-sm opacity-90">{policySubtitle}</p>
            </div>
          </div>
          
          {/* Mode Badge */}
          <div className="flex items-center space-x-2">
            {isEmergencyMode && <AlertTriangle className="w-5 h-5 animate-pulse" />}
            <span className="text-xl font-bold">{currentMode}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Mode Description from backend */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-700">
            {currentModeInfo.description ? (
              <><strong>{currentMode}:</strong> {currentModeInfo.description}</>
            ) : (
              <><strong>{currentMode}</strong> mode active.</>
            )}
          </p>
        </div>

        {/* Mode Toggle: cycle through backend modes */}
        {modeNames.length > 1 && (
          <div className="mb-6">
            <button
              onClick={handleModeToggle}
              className={`w-full py-3 px-6 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all ${
                isNormalMode ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              Switch to {modeNames[(modeNames.indexOf(currentMode) + 1) % modeNames.length] || modeNames[0]} Mode
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Click to change operational context
            </p>
          </div>
        )}

        {/* Allowed Tools */}
        <div className="mb-4">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
            Allowed Tools ({allowedTools.length})
          </h3>
          <div className="space-y-2">
            {allowedTools.map((tool) => (
              <div
                key={tool}
                className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm font-mono text-green-800">{tool}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Blocked Tools */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
            <XCircle className="w-5 h-5 mr-2 text-red-500" />
            Blocked Tools ({blockedTools.length})
          </h3>
          <div className="space-y-2">
            {blockedTools.map((tool) => (
              <div
                key={tool}
                className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <XCircle className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-sm font-mono text-red-800">{tool}</span>
                {alwaysBlocked.includes(tool) && (
                  <span className="ml-auto text-xs bg-red-600 text-white px-2 py-1 rounded">
                    ALWAYS BLOCKED
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-600 text-center">
          🛡️ All tool executions are validated against policy before execution
        </p>
      </div>
    </div>
  );
};

export default PolicyStatusCard;
