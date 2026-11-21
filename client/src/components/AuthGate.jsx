import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Shield, Headphones, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function AuthGate({ role = 'admin', onNavigate, children, apiRoot = '/api', agents = [] }) {
  const storageKey = `ticketflow_auth_${role}`;
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem(storageKey) === 'true';
  });

  const defaultAgents = [
    { id: 1, name: 'Sarah Chen', department: 'Technical Support', role: 'Technical Support Specialist' },
    { id: 2, name: 'Alex Kumar', department: 'Billing & Accounts', role: 'Billing & Accounts Lead' },
    { id: 3, name: 'David Miller', department: 'Product Escalations', role: 'Product Escalations Engineer' },
    { id: 4, name: 'Elena Rostova', department: 'Customer Success', role: 'Customer Success Manager' },
    { id: 5, name: 'Maya Lin', department: 'General Support', role: 'General Support Specialist' }
  ];
  const availableAgents = agents && agents.length > 0 ? agents : defaultAgents;

  const [selectedAgentId, setSelectedAgentId] = useState(() => {
    return sessionStorage.getItem('ticketflow_logged_agent_id') || String(availableAgents[0]?.id || 1);
  });

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roleTitle = role === 'admin' ? 'Admin Portal' : 'Agent Workspace';
  const roleIcon = role === 'admin' ? Shield : Headphones;
  const roleColor = role === 'admin' ? '#4f46e5' : '#059669';

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter the common password.');
      return;
    }

    if (role === 'agent' && !selectedAgentId) {
      setError('Please select an agent profile.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Verify with backend auth endpoint
      const res = await fetch(`${apiRoot}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() })
      });

      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem(storageKey, 'true');
        if (role === 'agent') {
          sessionStorage.setItem('ticketflow_logged_agent_id', String(selectedAgentId));
        }
        setIsAuthenticated(true);
      } else {
        setError(data.message || 'Invalid password. Please check and try again.');
      }
    } catch {
      // Fallback verification in case of offline dev mode
      if (password.trim() === 'admin123') {
        sessionStorage.setItem(storageKey, 'true');
        if (role === 'agent') {
          sessionStorage.setItem('ticketflow_logged_agent_id', String(selectedAgentId));
        }
        setIsAuthenticated(true);
      } else {
        setError('Invalid password. Please check and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(storageKey);
    if (role === 'agent') {
      sessionStorage.removeItem('ticketflow_logged_agent_id');
    }
    setIsAuthenticated(false);
    setPassword('');
  };

  if (!isAuthenticated) {
    const RoleIcon = roleIcon;
    return (
      <div className="auth-gate-container">
        <div className="auth-card">
          <div className="auth-card-header">
            <button
              type="button"
              className="btn-link back-to-site"
              onClick={() => onNavigate && onNavigate('/')}
            >
              <ArrowLeft size={16} />
              <span>Back to Homepage</span>
            </button>
            <div className="auth-role-avatar" style={{ backgroundColor: roleColor }}>
              <RoleIcon size={32} color="#fff" />
            </div>
            <h2>{roleTitle}</h2>
            <p className="auth-subtitle">
              {role === 'admin'
                ? 'This area is restricted to authorized administrators. Please enter the password to continue.'
                : 'Select your agent profile and enter the common password to access your assigned tickets.'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            {error && (
              <div className="auth-error-banner">
                {error}
              </div>
            )}

            {/* Agent Selector Dropdown for Agent Login */}
            {role === 'agent' && (
              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                  Select Agent Profile
                </label>
                <select
                  className="filter-select"
                  style={{
                    width: '100%',
                    padding: '0.65rem 2.25rem 0.65rem 0.85rem',
                    fontSize: '0.88rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff'
                  }}
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  required
                >
                  {availableAgents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} — {agent.department} ({agent.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Common Password Input */}
            <div className="form-group">
              <label>Common Password</label>
              <div className="password-input-wrapper">
                <Lock size={16} className="input-icon-left" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus={role !== 'agent'}
                  required
                />
                <button
                  type="button"
                  className="btn-icon toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              style={{ backgroundColor: roleColor, borderColor: roleColor, marginTop: '1.2rem' , }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : `Sign In`}
            </button>
          </form>

          <div className="auth-footer-links">
            <span>Looking for another page?</span>
            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.4rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-link"
                onClick={() => onNavigate && onNavigate('/')}
              >
                Homepage
              </button>
              {role === 'admin' ? (
                <>
                  <span>•</span>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => onNavigate && onNavigate('/agent')}
                  >
                    Agent Workspace
                  </button>
                </>
              ) : (
                <>
                  <span>•</span>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => onNavigate && onNavigate('/admin')}
                  >
                    Admin Portal
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated, render children with top session bar
  return (
    <div className="authenticated-wrapper">
      <div className="session-top-bar">
        <div className="session-left">
          <span className="session-role-badge" style={{ backgroundColor: roleColor }}>
            {roleTitle} Active
          </span>
          <span className="session-auth-badge">
            <CheckCircle2 size={13} color="#10b981" />
            <span>Authenticated</span>
          </span>
        </div>
        <div className="session-right">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate && onNavigate('/')}
            title="Go to Homepage"
          >
            Homepage
          </button>
          {role === 'admin' && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate && onNavigate('/agent')}
              title="Go to Agent Workspace"
            >
              Agent Workspace
            </button>
          )}
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={handleLogout}
            title="Log out from session"
          >
            Log Out
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
