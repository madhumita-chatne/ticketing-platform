import React from 'react';
import { Ticket, Plus, RefreshCw } from 'lucide-react';

export default function Header({ onNewTicket, onRefresh, loading }) {
  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-icon">
          <Ticket size={24} />
        </div>
        <div>
          <div className="brand-title">TicketFlow</div>
        </div>
      </div>

      <div className="header-actions">
        <button
          className="btn btn-secondary"
          onClick={onRefresh}
          title="Refresh ticket list"
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>

        {onNewTicket && (
          <button className="btn btn-primary" onClick={onNewTicket}>
            <Plus size={18} />
            <span>New Ticket</span>
          </button>
        )}
      </div>
    </header>
  );
}
