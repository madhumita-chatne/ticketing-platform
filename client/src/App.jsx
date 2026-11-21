import React, { useState, useEffect } from 'react';
import PortalNav from './components/PortalNav.jsx';
import CustomerPortal from './components/CustomerPortal.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import AgentScreen from './components/AgentScreen.jsx';

const API_ROOT = typeof window !== 'undefined' && window.location.port === '5173'
  ? 'http://localhost:5001/api'
  : '/api';

const API_TICKETS = `${API_ROOT}/tickets`;
const API_AGENTS = `${API_ROOT}/agents`;

export default function App() {
  // Read hash from URL to determine initial portal: '#customer', '#admin', or '#agent'
  const getInitialPortal = () => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (['customer', 'admin', 'agent'].includes(hash)) {
      return hash;
    }
    return 'customer'; // Default to customer-facing portal
  };

  const [activePortal, setActivePortal] = useState(getInitialPortal);
  const [agents, setAgents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    byStatus: { open: 0, in_progress: 0, resolved: 0, closed: 0 },
    byPriority: { low: 0, medium: 0, high: 0, urgent: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Filters for Admin Dashboard
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [viewMode, setViewMode] = useState('kanban');

  // Handle portal tab selection & hash sync
  const handleSelectPortal = (portalId) => {
    setActivePortal(portalId);
    window.location.hash = portalId;
  };

  // Listen to hash changes (back/forward browser buttons or direct URL change)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (['customer', 'admin', 'agent'].includes(hash)) {
        setActivePortal(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch agents roster
  const fetchAgents = async () => {
    try {
      const res = await fetch(API_AGENTS);
      const data = await res.json();
      if (data.success) {
        setAgents(data.data);
      }
    } catch (err) {
      console.error('Failed to load agents:', err);
    }
  };

  // Fetch tickets & stats
  const fetchTicketsAndStats = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (agentFilter !== 'all') params.append('agent_id', agentFilter);
      if (search.trim()) params.append('search', search.trim());

      const [ticketsRes, statsRes] = await Promise.all([
        fetch(`${API_TICKETS}?${params.toString()}`),
        fetch(`${API_TICKETS}/stats`)
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
      setErrorMessage('Could not connect to backend API. Ensure the server is running on http://localhost:5001.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAgents();
  }, []);

  // Filter effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTicketsAndStats();
    }, 150);
    return () => clearTimeout(timer);
  }, [search, statusFilter, priorityFilter, categoryFilter, agentFilter]);

  // Create or update ticket
  const handleSaveTicket = async (ticketData, id) => {
    const isEdit = Boolean(id);
    const url = isEdit ? `${API_TICKETS}/${id}` : API_TICKETS;
    const method = isEdit ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketData)
    });

    const resJson = await res.json();
    if (!resJson.success) {
      throw new Error(resJson.message || 'Operation failed');
    }

    await Promise.all([fetchTicketsAndStats(), fetchAgents()]);
  };

  // Quick status change
  const handleStatusChange = async (ticketId, nextStatus) => {
    try {
      const res = await fetch(`${API_TICKETS}/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchTicketsAndStats();
      }
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  // Quick assign ticket to agent (or auto-assign)
  const handleAssignAgent = async (ticketId, agentId) => {
    try {
      const isAuto = agentId === 'auto';
      const url = isAuto ? `${API_TICKETS}/${ticketId}/auto-assign` : `${API_TICKETS}/${ticketId}/assign`;
      const body = isAuto ? {} : { agent_id: agentId };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        await Promise.all([fetchTicketsAndStats(), fetchAgents()]);
      }
    } catch (err) {
      console.error('Failed to assign agent:', err);
    }
  };

  // Auto-assign all unassigned tickets
  const handleAutoAssignAll = async () => {
    try {
      const res = await fetch(`${API_TICKETS}/auto-assign-all`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        await Promise.all([fetchTicketsAndStats(), fetchAgents()]);
      }
    } catch (err) {
      console.error('Failed to auto-assign all:', err);
    }
  };

  // Delete ticket
  const handleDeleteTicket = async (ticketId) => {
    if (!confirm(`Are you sure you want to delete ticket #${ticketId}?`)) return;

    try {
      const res = await fetch(`${API_TICKETS}/${ticketId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        await Promise.all([fetchTicketsAndStats(), fetchAgents()]);
      }
    } catch (err) {
      console.error('Failed to delete ticket:', err);
    }
  };

  return (
    <div className="app-container">
      {/* Top Multi-App / Portal Switcher Bar */}
      <PortalNav
        activePortal={activePortal}
        onSelectPortal={handleSelectPortal}
        ticketCounts={{ total: stats.total }}
      />

      {/* Render Selected Application View */}
      {activePortal === 'customer' && (
        <CustomerPortal
          apiBase={API_TICKETS}
          onTicketCreated={() => {
            fetchTicketsAndStats();
            fetchAgents();
          }}
        />
      )}

      {activePortal === 'admin' && (
        <AdminDashboard
          tickets={tickets}
          stats={stats}
          agents={agents}
          loading={loading}
          errorMessage={errorMessage}
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
          viewMode={viewMode}
          setViewMode={setViewMode}
          onRefresh={() => {
            fetchTicketsAndStats();
            fetchAgents();
          }}
          onSaveTicket={handleSaveTicket}
          onStatusChange={handleStatusChange}
          onDeleteTicket={handleDeleteTicket}
          onAssignAgent={handleAssignAgent}
          onAutoAssignAll={handleAutoAssignAll}
          apiBase={API_TICKETS}
        />
      )}

      {activePortal === 'agent' && (
        <AgentScreen
          apiBase={API_TICKETS}
          agents={agents}
          onTicketUpdated={() => {
            fetchTicketsAndStats();
            fetchAgents();
          }}
        />
      )}
    </div>
  );
}
