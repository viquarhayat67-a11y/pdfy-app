import React, { useState, useEffect } from 'react';

export default function HistoryLog() {
  const [logs, setLogs] = useState([]);

  // Load logs from localStorage on mount
  useEffect(() => {
    const storedLogs = localStorage.getItem('pdfy_history_logs');
    if (storedLogs) {
      try {
        setLogs(JSON.parse(storedLogs).reverse()); // Show newest first
      } catch (e) {
        console.error("Failed to parse history logs", e);
      }
    }

    // Listen for custom events so the dashboard updates instantly when a tool finishes
    const handleLogUpdate = () => {
      const updatedLogs = localStorage.getItem('pdfy_history_logs');
      if (updatedLogs) setLogs(JSON.parse(updatedLogs).reverse());
    };

    window.addEventListener('pdfy_log_added', handleLogUpdate);
    return () => window.removeEventListener('pdfy_log_added', handleLogUpdate);
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('pdfy_history_logs');
    setLogs([]);
  };

  if (logs.length === 0) return null;

  return (
    <div style={{ marginTop: '40px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📜 Recent Activity Audit Trail
        </h3>
        <button 
          onClick={clearHistory}
          style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', color: '#64748b', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
        >
          Clear Logs
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
        {logs.map((log) => (
          <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #col-e2e8f0', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px' }}>{log.icon || '⚙️'}</span>
              <div>
                <strong style={{ color: '#0f172a' }}>{log.toolName}</strong>
                <span style={{ color: '#64748b', marginLeft: '8px' }}>{log.fileName}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {log.meta && <span style={{ backgroundColor: '#eef2ff', color: '#4f46e5', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>{log.meta}</span>}
              <span style={{ color: '#94a3b8', fontSize: '11px' }}>{log.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Global helper utility function to push new actions into localStorage from any component file
export const addHistoryLog = (toolName, fileName, icon = '⚙️', meta = '') => {
  const rawLogs = localStorage.getItem('pdfy_history_logs');
  let currentLogs = [];
  
  if (rawLogs) {
    try { currentLogs = JSON.parse(rawLogs); } catch(e) {}
  }

  const newLog = {
    id: Math.random().toString(),
    toolName,
    fileName,
    icon,
    meta,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  // Keep a maximum cache of 20 items so localStorage doesn't overflow
  if (currentLogs.length >= 20) currentLogs.shift();
  currentLogs.push(newLog);

  localStorage.setItem('pdfy_history_logs', JSON.stringify(currentLogs));
  window.dispatchEvent(new Event('pdfy_log_added')); // Alert UI components to redraw
};