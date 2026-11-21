import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header.jsx';
import StatCard from './components/StatCard.jsx';
import FilterBar from './components/FilterBar.jsx';
import TicketCard from './components/TicketCard.jsx';
import TicketModal from './components/TicketModal.jsx';
import { Layers, Clock, CheckCircle, CheckCheck, Inbox, AlertTriangle } from 'lucide-react';

const API_BASE = 'http://localhost:5001/api/tickets';

const KANBAN_COLUMNS = [
  { key: 'open', label: 'Open', color: '#1d4ed8' },
  { key: 'in_progress', label: 'In Progress', color: '#b45309' },
  { key: 'resolved', label: 'Resolved', color: '#047857' },
  { key: 'closed', label: 'Closed', color: '#475569' }
];

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    byStatus: { open: 0, in_progress: 0, resolved: 0, closed: 0 },
    byPriority: { low: 0, medium: 0, high: 0, urgent: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Filters & View
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);

  // Fetch tickets and stats from backend
  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      // Build query string for filters
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (search.trim()) params.append('search', search.trim());

      const [ticketsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}?${params.toString()}`),
        fetch(`${API_BASE}/stats`)
      ]);

      if (!ticketsRes.ok || !statsRes.ok) {
        throw new Error('Failed to connect to backend API server.');
      }

      const ticketsData = await ticketsRes.json();
      const statsData = await statsRes.json();

      if (ticketsData.success) {
        setTickets(ticketsData.data);
      }
      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Could not connect to backend API. Ensure the Node.js server is running on http://localhost:5001.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, statusFilter, priorityFilter, categoryFilter]);

  // Create or Update Ticket
  const handleSaveTicket = async (ticketData, id) => {
    const isEdit = Boolean(id);
    const url = isEdit ? `${API_BASE}/${id}` : API_BASE;
    const method = isEdit ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketData)
    });

    const resJson = await response.json();
    if (!resJson.success) {
      throw new Error(resJson.message || 'Operation failed');
    }

    await fetchData();
  };

  // Quick Status Change
  const handleStatusChange = async (ticketId, nextStatus) => {
    try {
      const response = await fetch(`${API_BASE}/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await response.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  // Delete Ticket
  const handleDeleteTicket = async (ticketId) => {
    if (!confirm(`Are you sure you want to delete ticket #${ticketId}?`)) return;

    try {
      const response = await fetch(`${API_BASE}/${ticketId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete ticket:', err);
    }
  };

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
    <div className="app-container">
      <Header
        onNewTicket={() => {
          setEditingTicket(null);
          setIsModalOpen(true);
        }}
        onRefresh={fetchData}
        loading={loading}
      />

      {errorMessage && (
        <div className="banner banner-info" style={{ backgroundColor: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

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
                      onEdit={(t) => {
                        setEditingTicket(t);
                        setIsModalOpen(true);
                      }}
                      onDelete={handleDeleteTicket}
                      onStatusChange={handleStatusChange}
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
                <th>Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assignee</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    No tickets match the selected filters.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600, color: '#64748b' }}>#{t.id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{t.title}</div>
                      {t.description && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '350px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="ticket-category">{t.category}</span>
                    </td>
                    <td>
                      <span className={`badge badge-priority-${t.priority}`}>{t.priority}</span>
                    </td>
                    <td>
                      <select
                        className={`filter-select badge badge-status-${t.status}`}
                        value={t.status}
                        onChange={(e) => handleStatusChange(t.id, e.target.value)}
                        style={{ cursor: 'pointer', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td>{t.assignee}</td>
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
                        onClick={() => handleDeleteTicket(t.id)}
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
        onSave={handleSaveTicket}
        onDelete={handleDeleteTicket}
        ticket={editingTicket}
      />
    </div>
  );
}
