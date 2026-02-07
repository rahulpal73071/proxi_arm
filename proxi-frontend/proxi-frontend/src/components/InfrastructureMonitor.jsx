/**
 * InfrastructureMonitor Component
 * 
 * Real-time infrastructure monitoring dashboard showing service health,
 * fleet size, and recent actions.
 */

import React from 'react';
import { Server, Activity, AlertCircle, CheckCircle, XCircle, Users } from 'lucide-react';
import { useProxi } from '../contexts/ProxiContext';

const InfrastructureMonitor = () => {
  const { services, fleetSize, recentActions, simulateIncident, loading } = useProxi();

  const getHealthIcon = (health) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500 animate-pulse" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'healthy':
        return 'border-green-500 bg-green-50';
      case 'degraded':
        return 'border-yellow-500 bg-yellow-50';
      case 'critical':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const handleSimulateIncident = async (serviceName) => {
    await simulateIncident(serviceName, 'critical');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const serviceEntries = Object.entries(services);
  const criticalCount = serviceEntries.filter(([_, health]) => health === 'critical').length;
  const healthyCount = serviceEntries.filter(([_, health]) => health === 'healthy').length;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Server className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Infrastructure Monitor</h2>
              <p className="text-sm opacity-90">Real-time Service Health</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 border-b">
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">{healthyCount}</div>
          <div className="text-xs text-gray-600">Healthy</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-red-600">{criticalCount}</div>
          <div className="text-xs text-gray-600">Critical</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{fleetSize}</div>
          <div className="text-xs text-gray-600">Fleet Size</div>
        </div>
      </div>

      {/* Service Status */}
      <div className="p-6">
        <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Service Status
        </h3>
        
        <div className="space-y-3">
          {serviceEntries.map(([serviceName, health]) => (
            <div
              key={serviceName}
              className={`p-4 border-l-4 rounded-lg ${getHealthColor(health)} transition-all`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getHealthIcon(health)}
                  <div>
                    <div className="font-semibold text-gray-800">{serviceName}</div>
                    <div className="text-sm text-gray-600 capitalize">{health}</div>
                  </div>
                </div>
                
                {health === 'healthy' && (
                  <button
                    onClick={() => handleSimulateIncident(serviceName)}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Simulate Failure
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fleet Information */}
      <div className="p-6 border-t bg-gray-50">
        <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Fleet Information
        </h3>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Active Instances</span>
            <span className="text-2xl font-bold text-blue-600">{fleetSize}</span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(fleetSize / 10) * 100}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Capacity: {fleetSize}/10 instances
          </div>
        </div>
      </div>

      {/* Recent Actions */}
      {recentActions.length > 0 && (
        <div className="p-6 border-t">
          <h3 className="font-semibold text-gray-700 mb-3">Recent Actions</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentActions.slice(-5).reverse().map((action, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded text-sm">
                <div className="flex justify-between">
                  <span className="font-mono text-xs text-gray-700">
                    {action.action}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(action.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InfrastructureMonitor;
