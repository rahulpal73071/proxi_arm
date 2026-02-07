/**
 * Dashboard Page
 * 
 * Main dashboard showing all Proxi components in a responsive grid layout.
 */

import React from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { useProxi } from '../contexts/ProxiContext';
import PolicyStatusCard from '../components/PolicyStatusCard';
import InfrastructureMonitor from '../components/InfrastructureMonitor';
import ToolExecutor from '../components/ToolExecutor';
import AgentChat from '../components/AgentChat';

const Dashboard = () => {
  const { refresh, loading, error, currentMode, appConfig } = useProxi();
  const appName = appConfig?.app_name ?? 'Proxi Dashboard';
  const tagline = appConfig?.tagline ?? 'Context-Aware Cloud Guardian';
  const features = appConfig?.features ?? [];
  const footerTitle = appConfig?.footer_title ?? 'Proxi: The Context-Aware Cloud Guardian';
  const footerLine = appConfig?.footer_line ?? 'Built for ArmorIQ Hackathon';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header from backend config */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{appName}</h1>
                <p className="text-sm text-gray-600">{tagline}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Current Mode Badge */}
              <div className={`px-4 py-2 rounded-lg font-semibold ${
                currentMode === 'NORMAL' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {currentMode} MODE
              </div>
              
              {/* Refresh Button */}
              <button
                onClick={refresh}
                disabled={loading}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
                title="Refresh all data"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Row: Policy and Infrastructure */}
          <div className="space-y-6">
            <PolicyStatusCard />
            <ToolExecutor />
          </div>
          
          <div className="space-y-6">
            <InfrastructureMonitor />
            <AgentChat />
          </div>
        </div>

        {/* Info Cards from backend */}
        {features.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-700 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer from backend config */}
      <footer className="mt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-200 pt-8 text-center text-sm text-gray-600">
            <p className="mb-2"><strong>{footerTitle}</strong></p>
            <p>{footerLine}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
