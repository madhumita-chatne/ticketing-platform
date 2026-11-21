import React from 'react';
import { Clock, User, AlertCircle, CheckCircle2, ChevronRight, Edit3, Trash2 } from 'lucide-react';

export default function TicketCard({ ticket, onEdit, onDelete, onStatusChange }) {
  const getInitials = (name) => {
    if (!name || name === 'Unassigned') return '?';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="ticket-card" onClick={() => onEdit(ticket)}>
      <div className="card-top">
        <span className="ticket-id">#{ticket.id}</span>
        <span className="ticket-category">{ticket.category}</span>
      </div>

      <h4 className="ticket-title">{ticket.title}</h4>

      {ticket.description && (
        <p className="ticket-desc">{ticket.description}</p>
      )}

      <div className="card-badges">
        <span className={`badge badge-priority-${ticket.priority}`}>
          {ticket.priority}
        </span>
        <span className={`badge badge-status-${ticket.status}`}>
          {ticket.status.replace('_', ' ')}
        </span>
      </div>

      <div className="card-footer" onClick={(e) => e.stopPropagation()}>
        <div className="assignee" title={`Assignee: ${ticket.assignee}`}>
          <div className="avatar">{getInitials(ticket.assignee)}</div>
          <span>{ticket.assignee}</span>
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
