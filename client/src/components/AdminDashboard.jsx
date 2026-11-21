import React, { useMemo } from 'react';
import Header from './Header.jsx';
import StatCard from './StatCard.jsx';
import FilterBar from './FilterBar.jsx';
import TicketCard from './TicketCard.jsx';
import TicketModal from './TicketModal.jsx';
import { formatTicketDueDate, getUrgentOverdueLabel } from '../utils.js';
import { Layers, Clock, CheckCircle, CheckCheck, Inbox, AlertTriangle, UserCheck, Shield } from 'lucide-react';

const KANBAN_COLUMNS = [
  { key: 'open', label: 'Open', color: '#1d4ed8' },
  { key: 'in_progress', label: 'In Progress', color: '#b45309' },
  { key: 'resolved', label: 'Resolved', color: '#047857' },
  { key: 'closed', label: 'Closed', color: '#475569' }
];

export default function AdminDashboard({
  tickets = [],
  stats = { total: 0, byStatus: { open: 0, in_progress: 0, resolved: 0, closed: 0 }, byPriority: { low: 0, medium: 0, high: 0, urgent: 0 } },
  agents = [],
  loading = false,
  errorMessage = '',
  search = '',
  setSearch,
  statusFilter = 'all',
  setStatusFilter,
  priorityFilter = 'all',
  setPriorityFilter,
  categoryFilter = 'all',
  setCategoryFilter,
  agentFilter = 'all',
  setAgentFilter,
  viewMode = 'kanban',
  setViewMode,
  onRefresh,
  onSaveTicket,
  onStatusChange,
  onDeleteTicket,
  onAssignAgent,
  onAutoAssignAll,
  apiBase
}) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingTicket, setEditingTicket] = React.useState(null);
  const [currentTime, setCurrentTime] = React.useState(() => new Date());

  React.useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  // Group tickets by status for Kanban
  const kanbanGrouped = useMemo(() => {
    const groups = {
      open: [],
      in_progress: [],
      resolved: [],
      closed: []
    };
    tickets.forEach((t) => {
      if (groups[t.status]) {
        groups[t.status].push(t);
      }
    });
    return groups;
  }, [tickets]);

  return (
    <div className="admin-dashboard-view">
      <Header
        onRefresh={onRefresh}
        loading={loading}
      />

      {errorMessage && (
        <div className="banner banner-info" style={{ backgroundColor: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Agents Roster Bar */}
      <div className="agents-roster-bar">
        <div className="roster-title">
          <Shield size={16} color="#4f46e5" />
          <span>Support Agents Team & Active Load:</span>
        </div>
        <div className="agents-roster-list">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`roster-pill ${agentFilter === String(agent.id) ? 'active' : ''}`}
              onClick={() => setAgentFilter(agentFilter === String(agent.id) ? 'all' : String(agent.id))}
              title={`Click to filter by ${agent.name}. Active load: ${agent.active_load || 0} tickets`}
            >
              <div className="roster-avatar" style={{ backgroundColor: agent.avatar_color || '#4f46e5' }}>
                {agent.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="roster-details">
                <span className="roster-name">{agent.name}</span>
                <span className="roster-role">{agent.department} • <strong>{agent.active_load || 0} active</strong></span>
              </div>
              <span className="roster-count">{agent.total_tickets || 0}</span>
            </div>
          ))}
        </div>
        {stats.unassigned > 0 && onAutoAssignAll && (
          <button
            className="btn btn-primary btn-sm"
            onClick={onAutoAssignAll}
            title="Auto-assign unassigned tickets to the least loaded agents"
            style={{ marginLeft: 'auto', background: '#059669', borderColor: '#059669' }}
          >
            <span>⚡ Auto-Assign ({stats.unassigned})</span>
          </button>
        )}
      </div>

      {/* Stats Summary Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total Tickets"
          count={stats.total}
          icon={Layers}
          color="#4f46e5"
          bgColor="#eef2ff"
          active={statusFilter === 'all'}
          onClick={() => setStatusFilter('all')}
        />
        <StatCard
          title="Open"
          count={stats.byStatus.open}
          icon={Inbox}
          color="#1d4ed8"
          bgColor="#eff6ff"
          active={statusFilter === 'open'}
          onClick={() => setStatusFilter(statusFilter === 'open' ? 'all' : 'open')}
        />
        <StatCard
          title="In Progress"
          count={stats.byStatus.in_progress}
          icon={Clock}
          color="#b45309"
          bgColor="#fffbeb"
          active={statusFilter === 'in_progress'}
          onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
        />
        <StatCard
          title="Resolved"
          count={stats.byStatus.resolved}
          icon={CheckCircle}
          color="#047857"
          bgColor="#ecfdf5"
          active={statusFilter === 'resolved'}
          onClick={() => setStatusFilter(statusFilter === 'resolved' ? 'all' : 'resolved')}
        />
      </div>

      {/* Filter and View Toolbar */}
      <FilterBar
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        agentFilter={agentFilter}
        setAgentFilter={setAgentFilter}
        agents={agents}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Main Content Area */}
      {viewMode === 'kanban' ? (
        <div className="kanban-board">
          {KANBAN_COLUMNS.map((col) => {
            const columnTickets = kanbanGrouped[col.key] || [];
            return (
              <div key={col.key} className="kanban-col">
                <div className="kanban-col-header">
                  <span style={{ color: col.color }}>{col.label}</span>
                  <span className="col-count">{columnTickets.length}</span>
                </div>

                {columnTickets.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                    No tickets in {col.label.toLowerCase()}
                  </div>
                ) : (
                  columnTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      agents={agents}
                      currentTime={currentTime}
                      onEdit={(t) => {
                        setEditingTicket(t);
                        setIsModalOpen(true);
                      }}
                      onDelete={onDeleteTicket}
                      onStatusChange={onStatusChange}
                      onAssignAgent={onAssignAgent}
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="table-container">
          <table className="ticket-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title / Concern</th>
                <th>Customer</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Assigned Agent</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    No tickets match the selected filters.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className={t.priority === 'urgent' ? 'urgent-ticket-row' : ''}>
                    <td style={{ fontWeight: 600, color: '#64748b' }}>#{t.id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{t.title || t.subject}</div>
                      {t.description && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{t.customer_name || 'Customer'}</div>
                      {t.customer_email && (
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t.customer_email}</div>
                      )}
                    </td>
                    <td>
                      <span className="ticket-category">{t.category}</span>
                    </td>
                    <td>
                      <span className={`badge badge-priority-${t.priority}`}>{t.priority}</span>
                    </td>
                    <td className={t.priority === 'urgent' ? 'urgent-ticket-due' : ''} style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {formatTicketDueDate(t)}
                      {getUrgentOverdueLabel(t, currentTime) && (
                        <div className="urgent-overdue-badge" style={{ marginTop: '0.25rem' }}>
                          <Clock size={11} />
                          <span>{getUrgentOverdueLabel(t, currentTime)}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <select
                        className={`filter-select badge badge-status-${t.status}`}
                        value={t.status}
                        onChange={(e) => onStatusChange(t.id, e.target.value)}
                        style={{ cursor: 'pointer', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td>
                      {/* Inline Agent Assignment in Table */}
                      <select
                        className="filter-select"
                        value={t.agent_id || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          onAssignAgent(t.id, val === 'auto' ? 'auto' : val ? Number(val) : null);
                        }}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', borderRadius: '6px' }}
                      >
                        <option value="">Unassigned</option>
                        <option value="auto">⚡ Auto-Assign (Least Loaded)</option>
                        {agents.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.active_load || 0} active)
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-icon"
                        style={{ marginRight: '0.3rem' }}
                        onClick={() => {
                          setEditingTicket(t);
                          setIsModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-icon"
                        style={{ color: '#ef4444' }}
                        onClick={() => onDeleteTicket(t.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Ticket Create / Edit Modal */}
      <TicketModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTicket(null);
        }}
        onSave={onSaveTicket}
        onDelete={onDeleteTicket}
        ticket={editingTicket}
        agents={agents}
        apiBase={apiBase}
      />
    </div>
  );
}
