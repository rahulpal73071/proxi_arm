import React, { useState, useEffect } from 'react';
import { Shield, Activity, Clock, Target, Zap, AlertTriangle, CheckCircle, XCircle, Info, Play, Pause } from 'lucide-react';

const API_BASE = '/api';

function App() {
  const [policyStatus, setPolicyStatus] = useState(null);
  const [infraStatus, setInfraStatus] = useState(null);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTool, setSelectedTool] = useState('');
  const [toolArgs, setToolArgs] = useState({});
  const [executionMode, setExecutionMode] = useState('REAL');
  const [lastResult, setLastResult] = useState(null);
  
  // Fetch status
  const fetchStatus = async () => {
    try {
      const [policy, infra, history] = await Promise.all([
        fetch(`${API_BASE}/policy/status`).then(r => r.json()),
        fetch(`${API_BASE}/infrastructure/status`).then(r => r.json()),
        fetch(`${API_BASE}/execution/history?limit=20`).then(r => r.json())
      ]);
      setPolicyStatus(policy);
      setInfraStatus(infra);
      setExecutionHistory(history.history || []);
    } catch (err) {
      setError('Failed to fetch status: ' + err.message);
    }
  };
  
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);
  
  // Mode management
  const setMode = async (mode) => {
    setLoading(true);
    setError(null);
    try {
      await fetch(`${API_BASE}/policy/set-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      await fetchStatus();
    } catch (err) {
      setError('Failed to set mode: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // CINDERELLA: Grant temporary permission
  const grantTemporary = async () => {
    const duration = parseInt(prompt('Duration in seconds:', '15'));
    if (!duration) return;
    
    const reason = prompt('Reason for emergency access:', 'Critical incident response');
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/policy/grant-temporary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_seconds: duration, reason })
      });
      const data = await res.json();
      setLastResult(data);
      await fetchStatus();
    } catch (err) {
      setError('Failed to grant permission: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // CINDERELLA: Extend permission
  const extendPermission = async () => {
    const additional = parseInt(prompt('Additional seconds:', '10'));
    if (!additional) return;
    
    setLoading(true);
    setError(null);
    try {
      await fetch(`${API_BASE}/policy/extend-temporary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additional_seconds: additional })
      });
      await fetchStatus();
    } catch (err) {
      setError('Failed to extend permission: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // CINDERELLA: Revoke permission
  const revokePermission = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetch(`${API_BASE}/policy/revoke-temporary`, { method: 'POST' });
      await fetchStatus();
    } catch (err) {
      setError('Failed to revoke permission: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // SCALPEL: Set incident scope
  const setIncidentScope = async () => {
    const services = prompt('Affected services (comma-separated):', 'web-server');
    if (!services) return;
    
    const incidentType = prompt('Incident type:', 'Service outage');
    const reason = prompt('Reason:', 'Critical service failure detected');
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/policy/set-incident-scope`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affected_services: services.split(',').map(s => s.trim()),
          incident_type: incidentType,
          reason
        })
      });
      const data = await res.json();
      setLastResult(data);
      await fetchStatus();
    } catch (err) {
      setError('Failed to set incident scope: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // SCALPEL: Clear incident scope
  const clearIncidentScope = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetch(`${API_BASE}/policy/clear-incident-scope`, { method: 'POST' });
      await fetchStatus();
    } catch (err) {
      setError('Failed to clear scope: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Simulate incident
  const simulateIncident = async (service, status) => {
    setLoading(true);
    setError(null);
    try {
      await fetch(`${API_BASE}/infrastructure/simulate-incident`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, status })
      });
      await fetchStatus();
    } catch (err) {
      setError('Failed to simulate incident: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Execute tool
  const executeTool = async () => {
    if (!selectedTool) {
      setError('Please select a tool');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/tools/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_name: selectedTool,
          arguments: toolArgs,
          execution_mode: executionMode
        })
      });
      const data = await res.json();
      setLastResult(data);
      await fetchStatus();
    } catch (err) {
      setError('Failed to execute tool: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (!policyStatus) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '1rem' }}>Loading Proxi Guardian...</p>
        </div>
      </div>
    );
  }
  
  const cinderella = policyStatus.protocols?.cinderella || {};
  const scalpel = policyStatus.protocols?.scalpel || {};
  
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <Shield size={32} color="#fff" />
            <h1 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 'bold' }}>Proxi Unified Guardian</h1>
          </div>
          <p style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>SCALPEL • SHADOW • CINDERELLA Protocols Active</p>
        </div>
      </header>
      
      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {error && (
          <div style={{ background: '#7f1d1d', border: '1px solid #991b1b', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} color="#fca5a5" />
            <span style={{ color: '#fca5a5' }}>{error}</span>
          </div>
        )}
        
        {/* Protocol Status Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {/* Mode Status */}
          <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Activity size={24} color="#3b82f6" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Mode Status</h2>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                onClick={() => setMode('NORMAL')}
                disabled={loading || policyStatus.current_mode === 'NORMAL'}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: policyStatus.current_mode === 'NORMAL' ? '#3b82f6' : '#334155',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: policyStatus.current_mode === 'NORMAL' ? 'default' : 'pointer',
                  fontWeight: '500'
                }}
              >
                NORMAL
              </button>
              <button
                onClick={() => setMode('EMERGENCY')}
                disabled={loading || policyStatus.current_mode === 'EMERGENCY'}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: policyStatus.current_mode === 'EMERGENCY' ? '#dc2626' : '#334155',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: policyStatus.current_mode === 'EMERGENCY' ? 'default' : 'pointer',
                  fontWeight: '500'
                }}
              >
                EMERGENCY
              </button>
            </div>
            <div style={{ background: '#0f172a', borderRadius: '0.5rem', padding: '0.75rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8' }}>Current Mode:</span>
                <span style={{ color: policyStatus.current_mode === 'EMERGENCY' ? '#ef4444' : '#3b82f6', fontWeight: '600' }}>
                  {policyStatus.current_mode}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Base Mode:</span>
                <span style={{ color: '#cbd5e1' }}>{policyStatus.base_mode}</span>
              </div>
            </div>
          </div>
          
          {/* CINDERELLA Protocol */}
          <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Clock size={24} color="#f59e0b" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>CINDERELLA Protocol</h2>
            </div>
            {cinderella.active ? (
              <>
                <div style={{ background: '#0f172a', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#94a3b8' }}>Time Remaining:</span>
                    <span style={{ color: '#fbbf24', fontWeight: '600' }}>
                      {Math.ceil(cinderella.remaining_seconds || 0)}s
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Expires At:</span>
                    <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>
                      {cinderella.expiry_time ? new Date(cinderella.expiry_time).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={extendPermission}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: '#0891b2',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Extend
                  </button>
                  <button
                    onClick={revokePermission}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: '#dc2626',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Revoke
                  </button>
                </div>
              </>
            ) : (
              <>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  No temporary permission active. Grant time-bounded emergency access.
                </p>
                <button
                  onClick={grantTemporary}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#f59e0b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Grant Temporary Access
                </button>
              </>
            )}
          </div>
          
          {/* SCALPEL Protocol */}
          <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Target size={24} color="#10b981" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>SCALPEL Protocol</h2>
            </div>
            {scalpel.incident_scope ? (
              <>
                <div style={{ background: '#0f172a', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: '#94a3b8' }}>Incident Type: </span>
                    <span style={{ color: '#cbd5e1' }}>{scalpel.incident_scope.incident_type}</span>
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: '#94a3b8' }}>Affected Services: </span>
                    <div style={{ marginTop: '0.25rem' }}>
                      {Array.from(scalpel.incident_scope.affected_services || []).map(svc => (
                        <span key={svc} style={{ display: 'inline-block', background: '#dc2626', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', marginRight: '0.25rem', fontSize: '0.75rem' }}>
                          {svc}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Reason: </span>
                    <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>{scalpel.incident_scope.reason}</span>
                  </div>
                </div>
                <button
                  onClick={clearIncidentScope}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Clear Incident Scope
                </button>
              </>
            ) : (
              <>
                <div style={{ background: '#0f172a', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: '#94a3b8' }}>Unhealthy Services: </span>
                    <div style={{ marginTop: '0.25rem' }}>
                      {(scalpel.unhealthy_services || []).length > 0 ? (
                        scalpel.unhealthy_services.map(svc => (
                          <span key={svc} style={{ display: 'inline-block', background: '#dc2626', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', marginRight: '0.25rem', fontSize: '0.75rem' }}>
                            {svc}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: '#10b981' }}>All services healthy</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={setIncidentScope}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Set Incident Scope
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Service Status */}
        <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #334155', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Infrastructure Status</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {infraStatus && Object.entries(infraStatus.services || {}).map(([service, health]) => {
              const healthColors = {
                healthy: '#10b981',
                degraded: '#f59e0b',
                critical: '#ef4444'
              };
              return (
                <div key={service} style={{ background: '#0f172a', borderRadius: '0.5rem', padding: '1rem', border: `2px solid ${healthColors[health] || '#64748b'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>{service}</span>
                    {health === 'healthy' && <CheckCircle size={16} color="#10b981" />}
                    {health === 'degraded' && <AlertTriangle size={16} color="#f59e0b" />}
                    {health === 'critical' && <XCircle size={16} color="#ef4444" />}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: healthColors[health], textTransform: 'uppercase', fontWeight: '600', marginBottom: '0.5rem' }}>
                    {health}
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem', fontSize: '0.625rem' }}>
                    {health !== 'critical' && (
                      <button
                        onClick={() => simulateIncident(service, 'critical')}
                        disabled={loading}
                        style={{
                          flex: 1,
                          padding: '0.25rem',
                          background: '#dc2626',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        Break
                      </button>
                    )}
                    {health !== 'healthy' && (
                      <button
                        onClick={() => simulateIncident(service, 'healthy')}
                        disabled={loading}
                        style={{
                          flex: 1,
                          padding: '0.25rem',
                          background: '#10b981',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        Fix
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Tool Execution */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Zap size={24} color="#8b5cf6" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Tool Execution</h2>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Tool</label>
              <select
                value={selectedTool}
                onChange={(e) => {
                  setSelectedTool(e.target.value);
                  setToolArgs({});
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f172a',
                  color: '#e2e8f0',
                  border: '1px solid #334155',
                  borderRadius: '0.5rem'
                }}
              >
                <option value="">Select a tool...</option>
                <option value="get_service_status">Get Service Status</option>
                <option value="list_services">List Services</option>
                <option value="read_logs">Read Logs</option>
                <option value="restart_service">Restart Service</option>
                <option value="scale_fleet">Scale Fleet</option>
                <option value="delete_database">Delete Database</option>
              </select>
            </div>
            
            {selectedTool === 'restart_service' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Service Name</label>
                <input
                  type="text"
                  value={toolArgs.service_name || ''}
                  onChange={(e) => setToolArgs({ ...toolArgs, service_name: e.target.value })}
                  placeholder="e.g., web-server"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#0f172a',
                    color: '#e2e8f0',
                    border: '1px solid #334155',
                    borderRadius: '0.5rem'
                  }}
                />
              </div>
            )}
            
            {selectedTool === 'scale_fleet' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Instance Count</label>
                <input
                  type="number"
                  value={toolArgs.count || ''}
                  onChange={(e) => setToolArgs({ ...toolArgs, count: parseInt(e.target.value) })}
                  placeholder="e.g., 5"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#0f172a',
                    color: '#e2e8f0',
                    border: '1px solid #334155',
                    borderRadius: '0.5rem'
                  }}
                />
              </div>
            )}
            
            {selectedTool === 'delete_database' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Database Name</label>
                <input
                  type="text"
                  value={toolArgs.db_name || ''}
                  onChange={(e) => setToolArgs({ ...toolArgs, db_name: e.target.value })}
                  placeholder="e.g., production-db"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#0f172a',
                    color: '#e2e8f0',
                    border: '1px solid #334155',
                    borderRadius: '0.5rem'
                  }}
                />
              </div>
            )}
            
            {selectedTool === 'get_service_status' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Service Name (optional)</label>
                <input
                  type="text"
                  value={toolArgs.service_name || ''}
                  onChange={(e) => setToolArgs({ ...toolArgs, service_name: e.target.value })}
                  placeholder="Leave empty for all services"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#0f172a',
                    color: '#e2e8f0',
                    border: '1px solid #334155',
                    borderRadius: '0.5rem'
                  }}
                />
              </div>
            )}
            
            {selectedTool === 'read_logs' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Number of Lines</label>
                <input
                  type="number"
                  value={toolArgs.lines || '10'}
                  onChange={(e) => setToolArgs({ ...toolArgs, lines: parseInt(e.target.value) })}
                  placeholder="10"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#0f172a',
                    color: '#e2e8f0',
                    border: '1px solid #334155',
                    borderRadius: '0.5rem'
                  }}
                />
              </div>
            )}
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Execution Mode</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setExecutionMode('REAL')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: executionMode === 'REAL' ? '#8b5cf6' : '#334155',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  <Play size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                  REAL
                </button>
                <button
                  onClick={() => setExecutionMode('SHADOW')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: executionMode === 'SHADOW' ? '#8b5cf6' : '#334155',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  <Pause size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                  SHADOW
                </button>
              </div>
            </div>
            
            <button
              onClick={executeTool}
              disabled={loading || !selectedTool}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: selectedTool ? '#8b5cf6' : '#334155',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: selectedTool ? 'pointer' : 'not-allowed',
                fontWeight: '600',
                fontSize: '1rem'
              }}
            >
              {loading ? 'Executing...' : 'Execute Tool'}
            </button>
          </div>
          
          {/* Last Result */}
          <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Info size={24} color="#06b6d4" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Last Result</h2>
            </div>
            <div style={{ background: '#0f172a', borderRadius: '0.5rem', padding: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
              <pre style={{ fontSize: '0.75rem', color: '#cbd5e1', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {lastResult ? JSON.stringify(lastResult, null, 2) : 'No result yet'}
              </pre>
            </div>
          </div>
        </div>
        
        {/* Execution History */}
        <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Execution History</h2>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {executionHistory.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No execution history yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {executionHistory.map((item, idx) => (
                  <div key={idx} style={{ background: '#0f172a', borderRadius: '0.5rem', padding: '0.75rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ color: '#94a3b8' }}>{item.action}</span>
                      <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {item.result && (
                      <div style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        display: 'inline-block',
                        background: item.result === 'ALLOWED' ? '#065f46' : item.result === 'BLOCKED_GLOBAL' || item.result === 'BLOCKED_MODE' ? '#7f1d1d' : '#1e40af',
                        color: item.result === 'ALLOWED' ? '#6ee7b7' : item.result.includes('BLOCKED') ? '#fca5a5' : '#93c5fd'
                      }}>
                        {item.result}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        .spinner {
          border: 4px solid #334155;
          border-top: 4px solid #8b5cf6;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed !important;
        }
        
        button:not(:disabled):hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}

export default App;