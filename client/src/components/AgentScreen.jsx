import React, { useState, useEffect, useMemo } from 'react';
import { getUrgentTimerLabel } from '../utils.js';
import { 
  Headphones, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Send, 
  User, 
  Filter, 
  ArrowRight, 
  Check, 
  RefreshCw,
  X,
  Mail,
  Building,
  Sparkles,
  LayoutGrid,
  List,
  ArrowUpDown
} from 'lucide-react';

export default function AgentScreen({ apiBase, agentsApiBase, agents = [], onTicketUpdated }) {
  // Currently active agent retrieved from the authenticated session
  const [selectedAgentId] = useState(() => {
    const saved = sessionStorage.getItem('ticketflow_logged_agent_id');
    return saved ? Number(saved) : (agents[0]?.id || 1);
  });

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  // View mode: default to 'list' view as requested
  const [viewMode, setViewMode] = useState('list');

  // Filtering & Sorting
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp_desc');

  // Active ticket modal
  const [activeTicket, setActiveTicket] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // New comment state
  const [agentComment, setAgentComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch tickets assigned to the logged-in agent
  const fetchAgentTickets = async () => {
    if (!selectedAgentId) return;
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}?agent_id=${selectedAgentId}`);
      const data = await res.json();
      if (data.success) {
        setTickets(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch agent tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentTickets();
  }, [selectedAgentId]);

  const activeAgent = agents.find((a) => a.id === Number(selectedAgentId)) || agents[0];

  const handleAvailabilityChange = async () => {
    if (!activeAgent || !agentsApiBase) return;

    const nextStatus = activeAgent.status === 'offline' ? 'online' : 'offline';
    try {
      setUpdatingStatus(true);
      const res = await fetch(`${agentsApiBase}/${activeAgent.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success && onTicketUpdated) {
        onTicketUpdated();
      }
    } catch (err) {
      console.error('Failed to update availability:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Open ticket detail & comments
  const handleOpenTicket = async (ticket) => {
    setActiveTicket(ticket);
    try {
      setLoadingDetails(true);
      const res = await fetch(`${apiBase}/${ticket.id}`);
      const data = await res.json();
      if (data.success) {
        setTicketDetails(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch ticket details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const refreshActiveTicket = async () => {
    if (!activeTicket) return;
    try {
      setLoadingDetails(true);
      const res = await fetch(`${apiBase}/${activeTicket.id}`);
      const data = await res.json();
      if (data.success) {
        setTicketDetails(data.data);
      }
    } catch (err) {
      console.error('Failed to refresh ticket:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Agent updates ticket status
  const handleUpdateStatus = async (newStatus) => {
    if (!activeTicket) return;
    try {
      const res = await fetch(`${apiBase}/${activeTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        await refreshActiveTicket();
        await fetchAgentTickets();
        if (onTicketUpdated) onTicketUpdated();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Agent posts a comment
  const handlePostAgentComment = async (e) => {
    e.preventDefault();
    if (!agentComment.trim() || !ticketDetails || !activeAgent) return;

    try {
      setSubmittingComment(true);
      const res = await fetch(`${apiBase}/${ticketDetails.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: activeAgent.name,
          author_role: 'agent',
          content: agentComment.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setAgentComment('');
        setCommentSuccess(true);
        setTimeout(() => setCommentSuccess(false), 3000);
        await refreshActiveTicket();
        await fetchAgentTickets();
        if (onTicketUpdated) onTicketUpdated();
      }
    } catch (err) {
      console.error('Failed to post agent comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Filter and sort tickets based on status, priority, and timestamp
  const priorityOrder = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1
  };

  const processedTickets = useMemo(() => {
    return tickets
      .filter((t) => {
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'timestamp_desc') {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        if (sortBy === 'timestamp_asc') {
          return new Date(a.created_at) - new Date(b.created_at);
        }
        if (sortBy === 'priority_desc') {
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        }
        if (sortBy === 'priority_asc') {
          return (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
        }
        return 0;
      });
  }, [tickets, statusFilter, priorityFilter, sortBy]);

  // Calculate agent stats
  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length
  };

  return (
    <div className="agent-screen">
      {/* Agent Profile Banner (Fixed to Logged In Agent - No Switcher) */}
      <div className="agent-profile-banner">
        <div className="agent-profile-info">
          <div className="agent-avatar-large" style={{ backgroundColor: activeAgent?.avatar_color || '#059669' }}>
            <Headphones size={28} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="agent-badge-pill">Support Agent Workspace</span>
              <span className={activeAgent?.status === 'offline' ? 'agent-status-offline' : 'agent-status-online'}>
                ● {activeAgent?.status === 'offline' ? 'Offline' : 'Online'}
              </span>
            </div>
            <h2 className="agent-name-title">{activeAgent?.name || 'Support Agent'}</h2>
            <div className="agent-meta-line">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <Building size={14} />
                {activeAgent?.department || 'Support'}
              </span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <Mail size={14} />
                {activeAgent?.email || 'agent@support.com'}
              </span>
              <span>•</span>
              <span>{activeAgent?.role || 'Specialist'}</span>
            </div>
          </div>
        </div>

        {/* Logged In Info Badge */}
        <div className="agent-session-info-badge">
          <div className="agent-logged-tag">
            <Check size={14} />
            <span>Logged in as {activeAgent?.name?.split(' ')[0] || 'Agent'}</span>
          </div>
          <button
            type="button"
            className={`agent-availability-toggle ${activeAgent?.status === 'offline' ? 'offline' : 'online'}`}
            onClick={handleAvailabilityChange}
            disabled={updatingStatus || !activeAgent}
          >
            {updatingStatus
              ? 'Updating...'
              : activeAgent?.status === 'offline'
                ? 'Go Online'
                : 'Go Offline'}
          </button>
          <span className="agent-active-workload">
            {stats.open + stats.inProgress} Active Ticket{(stats.open + stats.inProgress) === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Agent Metric Cards for Quick Status Filtering */}
      <div className="agent-metrics-row">
        <div
          className={`agent-metric-card ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          <span className="metric-label">Assigned Tickets</span>
          <span className="metric-value" style={{ color: '#0f172a' }}>{stats.total}</span>
        </div>
        <div
          className={`agent-metric-card ${statusFilter === 'open' ? 'active' : ''}`}
          onClick={() => setStatusFilter('open')}
        >
          <span className="metric-label">Needs Attention (Open)</span>
          <span className="metric-value" style={{ color: '#1d4ed8' }}>{stats.open}</span>
        </div>
        <div
          className={`agent-metric-card ${statusFilter === 'in_progress' ? 'active' : ''}`}
          onClick={() => setStatusFilter('in_progress')}
        >
          <span className="metric-label">In Progress</span>
          <span className="metric-value" style={{ color: '#b45309' }}>{stats.inProgress}</span>
        </div>
        <div
          className={`agent-metric-card ${statusFilter === 'resolved' ? 'active' : ''}`}
          onClick={() => setStatusFilter('resolved')}
        >
          <span className="metric-label">Resolved / Closed</span>
          <span className="metric-value" style={{ color: '#047857' }}>{stats.resolved}</span>
        </div>
      </div>

      {/* Assigned Tickets Section */}
      <div className="customer-section">
        <div className="customer-section-header" style={{ flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start' }}>
          <div>
            <h3 className="section-title">
              Tickets Assigned to {activeAgent?.name} ({processedTickets.length})
            </h3>
            <p className="section-desc">
              Select a ticket to investigate, change resolution status, and send comments directly to the customer.
            </p>
          </div>

          {/* Controls: Filtering, Sorting, and View Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {/* Priority Filter */}
            {/* <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Filter size={14} style={{ color: '#64748b' }} />
              <select
                className="filter-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                title="Filter by priority"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div> */}

            {/* Sorting Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <ArrowUpDown size={14} style={{ color: '#64748b' }} />
              <select
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                title="Sort tickets"
              >
                <option value="timestamp_desc">Date: Newest First</option>
                <option value="timestamp_asc">Date: Oldest First</option>
                <option value="priority_desc">Priority: Urgent First</option>
                <option value="priority_asc">Priority: Low First</option>
              </select>
            </div>

            {/* View Mode Toggle (List vs Card) */}
            <div className="view-mode-toggle">
              <button
                type="button"
                className={`btn-view-toggle ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Switch to List View"
              >
                <List size={15} />
                <span>List</span>
              </button>
              <button
                type="button"
                className={`btn-view-toggle ${viewMode === 'card' ? 'active' : ''}`}
                onClick={() => setViewMode('card')}
                title="Switch to Card View"
              >
                <LayoutGrid size={15} />
                <span>Cards</span>
              </button>
            </div>

            <button className="btn btn-secondary" onClick={fetchAgentTickets} disabled={loading} title="Refresh tickets">
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <Clock size={32} className="spin" style={{ color: '#059669' }} />
            <p>Loading assigned tickets...</p>
          </div>
        ) : processedTickets.length === 0 ? (
          <div className="empty-state">
            <CheckCircle2 size={40} style={{ color: '#10b981' }} />
            <h3>No tickets in this view!</h3>
            <p>
              {statusFilter === 'all' && priorityFilter === 'all'
                ? `No tickets currently assigned to ${activeAgent?.name}. New tickets will appear here when assigned.`
                : `No matching tickets found with current filter selections.`}
            </p>
          </div>
        ) : viewMode === 'list' ? (
          /* List / Table View (Default) */
          <div className="table-container">
            <table className="ticket-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>ID</th>
                  <th>Concern & Details</th>
                  <th style={{ width: '100px' }}>Priority</th>
                  <th style={{ width: '120px' }}>Status</th>
                  <th style={{ width: '160px' }}>Customer</th>
                  <th style={{ width: '140px' }}>Logged At</th>
                  <th style={{ width: '85px' }}>Replies</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {processedTickets.map((t) => (
                  <tr key={t.id} onClick={() => handleOpenTicket(t)} style={{ cursor: 'pointer' }}>
                    <td>
                      <span className="complaint-id" style={{ fontWeight: 700 }}>#{t.id}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                        {t.title || t.subject}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '420px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.description || 'No description provided.'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-priority-${t.priority}`}>{t.priority}</span>
                      {getUrgentTimerLabel(t, currentTime) && (
                        <div className={`urgent-overdue-badge ${getUrgentTimerLabel(t, currentTime).type === 'countdown' ? 'urgent-countdown-badge' : ''}`} style={{ marginTop: '0.35rem' }}>
                          <Clock size={11} />
                          <span>{getUrgentTimerLabel(t, currentTime).text}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-status-${t.status}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                        <User size={13} style={{ color: '#64748b' }} />
                        <span style={{ fontWeight: 500 }}>{t.customer_name || 'Customer'}</span>
                      </div>
                      {t.customer_email && (
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{t.customer_email}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={12} />
                        <span>{new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td>
                      <span className="complaint-comments-badge" style={{ fontSize: '0.78rem' }}>
                        <MessageSquare size={12} />
                        <span>{t.comments_count || 0}</span>
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        style={{ background: '#059669', borderColor: '#059669', padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTicket(t);
                        }}
                      >
                        Open <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Card View */
          <div className="complaints-grid">
            {processedTickets.map((t) => (
              <div
                key={t.id}
                className="complaint-card agent-ticket-card"
                onClick={() => handleOpenTicket(t)}
              >
                <div className="complaint-card-top">
                  <span className="complaint-id">#{t.id}</span>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <span className={`badge badge-priority-${t.priority}`}>{t.priority}</span>
                    <span className={`badge badge-status-${t.status}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {getUrgentTimerLabel(t, currentTime) && (
                  <div className={`urgent-overdue-badge ${getUrgentTimerLabel(t, currentTime).type === 'countdown' ? 'urgent-countdown-badge' : ''}`} style={{ marginBottom: '0.75rem' }}>
                    <Clock size={12} />
                    <span>{getUrgentTimerLabel(t, currentTime).text}</span>
                  </div>
                )}

                <h3 className="complaint-subject">{t.title || t.subject}</h3>
                <p className="complaint-concern">{t.description || 'No description provided.'}</p>

                <div className="agent-ticket-customer-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <User size={13} style={{ color: '#64748b' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t.customer_name || 'Customer'}</span>
                  </div>
                  <span className="ticket-category">{t.category}</span>
                </div>

                <div className="complaint-footer">
                  <div className="complaint-comments-badge">
                    <MessageSquare size={14} />
                    <span>{t.comments_count || 0} comment{(t.comments_count || 0) === 1 ? '' : 's'}</span>
                  </div>
                  <span className="open-ticket-link">
                    Open & Reply <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Investigation & Commenting Modal */}
      {activeTicket && (
        <div className="modal-overlay" onClick={() => setActiveTicket(null)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span className="complaint-id">Ticket #{activeTicket.id}</span>
                  <span className={`badge badge-status-${ticketDetails?.status || activeTicket.status}`}>
                    {(ticketDetails?.status || activeTicket.status).replace('_', ' ')}
                  </span>
                  <span className={`badge badge-priority-${ticketDetails?.priority || activeTicket.priority}`}>
                    {ticketDetails?.priority || activeTicket.priority}
                  </span>
                  {getUrgentTimerLabel(ticketDetails || activeTicket, currentTime) && (
                    <span className={`urgent-overdue-badge ${getUrgentTimerLabel(ticketDetails || activeTicket, currentTime).type === 'countdown' ? 'urgent-countdown-badge' : ''}`}>
                      <Clock size={12} />
                      {getUrgentTimerLabel(ticketDetails || activeTicket, currentTime).text}
                    </span>
                  )}
                  <span className="ticket-category">{ticketDetails?.category || activeTicket.category}</span>
                </div>
                <h3>{ticketDetails?.title || ticketDetails?.subject || activeTicket.title}</h3>
              </div>
              <button className="btn-icon" onClick={() => setActiveTicket(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body conversation-modal-body">
              {/* Customer & Concern Banner */}
              <div className="original-concern-box">
                <div className="concern-box-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="avatar" style={{ backgroundColor: '#4f46e5' }}>
                      <User size={14} color="#fff" />
                    </div>
                    <div>
                      <strong>Customer: {ticketDetails?.customer_name || 'Customer'}</strong>
                      {ticketDetails?.customer_email && (
                        <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.5rem' }}>
                          ({ticketDetails.customer_email})
                        </span>
                      )}
                      <div className="concern-date">
                        Logged on {new Date(ticketDetails?.created_at || activeTicket.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="concern-text">
                  {ticketDetails?.description || activeTicket.description || 'No description provided.'}
                </div>
              </div>

              {/* Status Action Toolbar */}
              <div className="agent-action-bar">
                <span className="action-bar-label">Update Ticket Status:</span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    className={`btn btn-sm ${ticketDetails?.status === 'in_progress' ? 'btn-active-status' : 'btn-secondary'}`}
                    onClick={() => handleUpdateStatus('in_progress')}
                  >
                    <Clock size={14} />
                    <span>Mark In Progress</span>
                  </button>
                  <button
                    className={`btn btn-sm ${ticketDetails?.status === 'resolved' ? 'btn-active-status' : 'btn-secondary'}`}
                    onClick={() => handleUpdateStatus('resolved')}
                    style={{ color: '#047857' }}
                  >
                    <CheckCircle2 size={14} />
                    <span>Mark Resolved</span>
                  </button>
                  <button
                    className={`btn btn-sm ${ticketDetails?.status === 'open' ? 'btn-active-status' : 'btn-secondary'}`}
                    onClick={() => handleUpdateStatus('open')}
                  >
                    <span>Reopen</span>
                  </button>
                  <button
                    className={`btn btn-sm ${ticketDetails?.status === 'closed' ? 'btn-active-status' : 'btn-secondary'}`}
                    onClick={() => handleUpdateStatus('closed')}
                  >
                    <span>Close</span>
                  </button>
                </div>
              </div>

              {/* Comments Thread */}
              <div className="comments-thread-section">
                <h4 className="thread-title">
                  <MessageSquare size={16} />
                  <span>Communication History ({ticketDetails?.comments?.length || 0})</span>
                </h4>

                {loadingDetails ? (
                  <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>
                    <RefreshCw size={18} className="spin" style={{ margin: '0 auto 0.4rem', display: 'block' }} />
                    Loading conversation...
                  </div>
                ) : !ticketDetails?.comments || ticketDetails.comments.length === 0 ? (
                  <div className="empty-comments-banner">
                    <p style={{ fontWeight: 500, color: '#475569' }}>No comments recorded yet.</p>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      Add a comment below to update the customer. It will appear on their Customer Portal immediately.
                    </p>
                  </div>
                ) : (
                  <div className="comments-list">
                    {ticketDetails.comments.map((comment) => {
                      const isAgent = comment.author_role === 'agent';
                      return (
                        <div
                          key={comment.id}
                          className={`comment-bubble ${isAgent ? 'comment-agent' : 'comment-customer'}`}
                        >
                          <div className="comment-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              {isAgent ? (
                                <span className="agent-tag">
                                  <Headphones size={12} />
                                  <span>Agent</span>
                                </span>
                              ) : (
                                <span className="customer-tag">
                                  <User size={12} />
                                  <span>Customer</span>
                                </span>
                              )}
                              <strong>{comment.author}</strong>
                            </div>
                            <span className="comment-time">
                              {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="comment-body">{comment.content}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Agent Comment Form */}
                <form onSubmit={handlePostAgentComment} className="reply-form agent-reply-box">
                  <div className="reply-notice-banner">
                    <Sparkles size={14} />
                    <span>
                      Responding as <strong>{activeAgent?.name}</strong>. This comment will be immediately visible to the customer on their portal.
                    </span>
                  </div>

                  {commentSuccess && (
                    <div style={{ color: '#15803d', background: '#dcfce7', padding: '0.5rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                      ✓ Response posted and synced with customer portal!
                    </div>
                  )}

                  <textarea
                    rows={4}
                    placeholder={`Hello ${ticketDetails?.customer_name || 'Customer'}, I have reviewed your concern and...`}
                    value={agentComment}
                    onChange={(e) => setAgentComment(e.target.value)}
                    required
                  />

                  <div className="reply-form-actions">
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Role: <strong>{activeAgent?.role}</strong>
                    </span>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ background: '#059669', borderColor: '#059669' }}
                      disabled={submittingComment || !agentComment.trim()}
                    >
                      <Send size={15} />
                      <span>{submittingComment ? 'Sending...' : 'Send Response to Customer'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActiveTicket(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
