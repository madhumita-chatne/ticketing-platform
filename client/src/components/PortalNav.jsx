import React from 'react';
import { User, Shield, Headphones, Sparkles } from 'lucide-react';

export default function PortalNav({ activePortal, onSelectPortal, ticketCounts = {} }) {
  const portals = [
    {
      id: 'customer',
      name: 'Customer Portal',
      tagline: 'Raise Complaints & Track Help Requests',
      icon: User,
      badgeColor: '#0284c7',
      accentColor: '#38bdf8'
    },
    {
      id: 'admin',
      name: 'Admin Dashboard',
      tagline: 'Kanban, Tables & Assign 5 Agents',
      icon: Shield,
      badgeColor: '#4f46e5',
      accentColor: '#818cf8',
      count: ticketCounts.total
    },
    {
      id: 'agent',
      name: 'Agent Screen',
      tagline: 'My Assigned Tickets & Add Comments',
      icon: Headphones,
      badgeColor: '#059669',
      accentColor: '#34d399'
    }
  ];

  return (
    <nav className="portal-nav-bar">
      <div className="portal-nav-header">
        <div className="portal-nav-title">
          <Sparkles size={18} className="sparkle-icon" />
          <span>Unified Support Suite</span>
        </div>
      </div>

      <div className="portal-tabs">
        {portals.map((portal) => {
          const Icon = portal.icon;
          const isActive = activePortal === portal.id;
          return (
            <button
              key={portal.id}
              className={`portal-tab ${isActive ? 'active' : ''}`}
              onClick={() => onSelectPortal(portal.id)}
            >
              <div className="portal-tab-icon" style={{ backgroundColor: isActive ? portal.badgeColor : '#e2e8f0', color: isActive ? '#fff' : '#475569' }}>
                <Icon size={18} />
              </div>
              <div className="portal-tab-info">
                <div className="portal-tab-name">
                  {portal.name}
                  {portal.count !== undefined && (
                    <span className="tab-pill-count">{portal.count}</span>
                  )}
                </div>
                <div className="portal-tab-tagline">{portal.tagline}</div>
              </div>
              {isActive && <div className="portal-active-indicator" style={{ backgroundColor: portal.badgeColor }} />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
