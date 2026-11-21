import React from 'react';
import { Clock, User, Headphones, MessageSquare, Edit3, Trash2 } from 'lucide-react';

export default function TicketCard({ ticket, agents = [], onEdit, onDelete, onStatusChange, onAssignAgent }) {
  const getInitials = (name) => {
    if (!name || name === 'Unassigned') return '?';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const hasAgent = ticket.agent_id && ticket.assignee !== 'Unassigned';

  return (
    <div className="ticket-card" onClick={() => onEdit(ticket)}>
      <div className="card-top">
        <span className="ticket-id">#{ticket.id}</span>
        <span className="ticket-category">{ticket.category}</span>
      </div>

      <h4 className="ticket-title">{ticket.title || ticket.subject}</h4>

      {ticket.description && (
        <p className="ticket-desc">{ticket.description}</p>
      )}

      {ticket.customer_name && ticket.customer_name !== 'Customer' && (
        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <User size={12} />
          <span>Customer: <strong>{ticket.customer_name}</strong></span>
        </div>
      )}

      <div className="card-badges">
        <span className={`badge badge-priority-${ticket.priority}`}>
          {ticket.priority}
        </span>
        <span className={`badge badge-status-${ticket.status}`}>
          {ticket.status.replace('_', ' ')}
        </span>
        {(ticket.comments_count || 0) > 0 && (
          <span className="badge-comments-count" title={`${ticket.comments_count} comment(s)`}>
            <MessageSquare size={11} />
            <span>{ticket.comments_count}</span>
          </span>
        )}
      </div>

      <div className="card-footer" onClick={(e) => e.stopPropagation()}>
        {/* Quick Assign Agent Dropdown */}
        <div className="assign-control-group">
          <div className="avatar" style={{ backgroundColor: ticket.agent_avatar_color || '#94a3b8' }}>
            {getInitials(ticket.assignee)}
          </div>
          <select
            className="card-agent-select"
            value={ticket.agent_id || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (onAssignAgent) {
                onAssignAgent(ticket.id, val ? Number(val) : null);
              }
            }}
            title="Assign ticket to an agent"
          >
            <option value="">Unassigned</option>
            <option value="auto">⚡ Auto-Assign (Least Loaded)</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(ticket);
            }}
            title="Edit ticket"
          >
            <Edit3 size={14} />
          </button>
          <button
            className="btn-icon"
            style={{ color: '#ef4444' }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(ticket.id);
            }}
            title="Delete ticket"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
