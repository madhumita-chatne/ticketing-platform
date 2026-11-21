import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Send, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  User, 
  HelpCircle, 
  Search, 
  RefreshCw,
  X,
  ShieldCheck,
  Headphones,
  LayoutGrid,
  List
} from 'lucide-react';

export default function CustomerPortal({ apiBase, onTicketCreated }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('cards');
  
  // Modal states
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // New complaint form state
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    customer_name: '',
    customer_email: '',
    category: 'Complaint'
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [formError, setFormError] = useState('');

  // Customer comment reply state
  const [customerComment, setCustomerComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  // Fetch all customer complaints
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}`);
      const data = await res.json();
      if (data.success) {
        setComplaints(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Fetch full details and comments for selected ticket
  const openTicketDetails = async (ticket) => {
    setSelectedTicket(ticket);
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

  const refreshSelectedTicket = async () => {
    if (!selectedTicket) return;
    try {
      setLoadingDetails(true);
      const res = await fetch(`${apiBase}/${selectedTicket.id}`);
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

  // Submit new complaint
  const handleRaiseComplaint = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim()) {
      setFormError('Please enter a subject for your concern.');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Please enter details of your concern.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      const payload = {
        title: formData.subject.trim(),
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        customer_name: formData.customer_name.trim() || 'Valued Customer',
        customer_email: formData.customer_email.trim(),
        category: formData.category,
        status: 'open',
        assignee: 'Unassigned'
      };

      const res = await fetch(`${apiBase}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || 'Failed to submit complaint');
      }

      setSubmitSuccess(json.data);
      setFormData({
        subject: '',
        description: '',
        customer_name: '',
        customer_email: '',
        category: 'Complaint'
      });
      await fetchComplaints();
      if (onTicketCreated) onTicketCreated();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Customer replies to ticket
  const handleSendCustomerComment = async (e) => {
    e.preventDefault();
    if (!customerComment.trim() || !ticketDetails) return;

    try {
      setSendingComment(true);
      const authorName = ticketDetails.customer_name && ticketDetails.customer_name !== 'Customer' 
        ? ticketDetails.customer_name 
        : 'Customer';

      const res = await fetch(`${apiBase}/${ticketDetails.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: authorName,
          author_role: 'customer',
          content: customerComment.trim()
        })
      });

      const json = await res.json();
      if (json.success) {
        setCustomerComment('');
        await refreshSelectedTicket();
        await fetchComplaints();
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSendingComment(false);
    }
  };

  // Filter complaints list
  const filteredComplaints = complaints.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.subject && c.subject.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      String(c.id).includes(q) ||
      (c.customer_name && c.customer_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="customer-portal">
      {/* Hero Banner */}
      <div className="customer-hero">
        <div className="customer-hero-content">
          <div className="customer-badge">
            <HelpCircle size={15} />
            <span>Customer Support & Complaints Center</span>
          </div>
          <h1 className="customer-title">How can we help you today?</h1>
          <p className="customer-subtitle">
            Submit your concern directly to our dedicated support team. Our agents will investigate and respond to your complaint here in real-time.
          </p>
          <div className="customer-hero-actions">
            <button
              className="btn btn-primary btn-large"
              onClick={() => {
                setSubmitSuccess(null);
                setFormError('');
                setIsRaiseModalOpen(true);
              }}
            >
              <PlusCircle size={20} />
              <span>Raise a Complaint</span>
            </button>
            <button className="btn btn-secondary" onClick={fetchComplaints} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* Complaints Tracking Section */}
      <div className="customer-section">
        <div className="customer-section-header">
          <div>
            <h2 className="section-title">Track Your Support Requests & Complaints</h2>
            <p className="section-desc">Click on any complaint to view agent responses and live resolution progress.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <div className="search-box" style={{ width: '320px' }}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by ID, subject or concern..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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
                className={`btn-view-toggle ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
                title="Switch to Card View"
              >
                <LayoutGrid size={15} />
                <span>Cards</span>
              </button>
            </div>
          </div>
        </div>

        {loading && complaints.length === 0 ? (
          <div className="empty-state">
            <Clock size={32} className="spin" style={{ color: '#0284c7' }} />
            <p>Loading complaints...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={40} style={{ color: '#94a3b8' }} />
            <h3>No complaints found</h3>
            <p>
              {searchQuery
                ? 'No tickets match your search query.'
                : 'You have not submitted any complaints yet. Click "Raise a Complaint" above to get started!'}
            </p>
            {!searchQuery && (
              <button
                className="btn btn-primary"
                style={{ marginTop: '1rem' }}
                onClick={() => setIsRaiseModalOpen(true)}
              >
                <PlusCircle size={16} />
                <span>Raise a Complaint</span>
              </button>
            )}
          </div>
        ) : viewMode === 'list' ? (
          <div className="table-container">
            <table className="ticket-table">
              <thead>
                <tr>
                  <th style={{ width: '90px' }}>ID</th>
                  <th>Concern & Details</th>
                  <th style={{ width: '120px' }}>Priority</th>
                  <th style={{ width: '130px' }}>Status</th>
                  <th style={{ width: '180px' }}>Assigned Agent</th>
                  <th style={{ width: '140px' }}>Logged At</th>
                  <th style={{ width: '95px' }}>Replies</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => openTicketDetails(item)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <span className="complaint-id">#{item.id}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                        {item.subject || item.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '420px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.description || 'No additional details provided.'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-priority-${item.priority}`}>{item.priority}</span>
                    </td>
                    <td>
                      <span className={`badge badge-status-${item.status}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {item.agent_name && item.agent_name !== 'Unassigned' ? (
                        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{item.agent_name}</span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#b45309' }}>Waiting for assignment</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={12} />
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td>
                      <span className="complaint-comments-badge" style={{ fontSize: '0.78rem' }}>
                        <MessageSquare size={12} />
                        <span>{item.comments_count || 0}</span>
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        style={{ background: '#0284c7', borderColor: '#0284c7', padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openTicketDetails(item);
                        }}
                      >
                        Track
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="complaints-grid">
            {filteredComplaints.map((item) => {
              const hasAgent = item.agent_name && item.agent_name !== 'Unassigned';
              return (
                <div
                  key={item.id}
                  className="complaint-card"
                  onClick={() => openTicketDetails(item)}
                >
                  <div className="complaint-card-top">
                    <span className="complaint-id">Complaint #{item.id}</span>
                    <span className={`badge badge-status-${item.status}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="complaint-subject">{item.subject || item.title}</h3>
                  <p className="complaint-concern">{item.description || 'No additional details provided.'}</p>

                  <div className="complaint-meta">
                    <span className="ticket-category">{item.category}</span>
                    <span className={`badge badge-priority-${item.priority}`}>{item.priority} priority</span>
                  </div>

                  <div className="complaint-footer">
                    <div className="complaint-agent-info">
                      {hasAgent ? (
                        <>
                          <div className="agent-avatar-small" style={{ backgroundColor: item.agent_avatar_color || '#059669' }}>
                            <Headphones size={13} />
                          </div>
                          <span className="agent-name-text">
                            Agent: <strong>{item.agent_name}</strong>
                          </span>
                        </>
                      ) : (
                        <>
                          <Clock size={14} style={{ color: '#d97706' }} />
                          <span style={{ color: '#b45309', fontSize: '0.8rem' }}>Waiting for Agent Assignment</span>
                        </>
                      )}
                    </div>

                    <div className="complaint-comments-badge">
                      <MessageSquare size={14} />
                      <span>{item.comments_count || 0} response{(item.comments_count || 0) === 1 ? '' : 's'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Raise a Complaint Modal */}
      {isRaiseModalOpen && (
        <div className="modal-overlay" onClick={() => setIsRaiseModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div className="brand-icon" style={{ width: '32px', height: '32px', background: '#0284c7' }}>
                  <HelpCircle size={18} color="#fff" />
                </div>
                <h3>Raise a Complaint / Support Request</h3>
              </div>
              <button className="btn-icon" onClick={() => setIsRaiseModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {submitSuccess ? (
              <div className="modal-body" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#0f172a' }}>
                  Complaint #{submitSuccess.id} Submitted & Auto-Assigned!
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                  Your concern regarding <strong>"{submitSuccess.title}"</strong> has been logged and automatically assigned to support specialist{' '}
                  <strong style={{ color: '#047857' }}>{submitSuccess.agent_name || 'an available specialist'}</strong>{' '}
                  ({submitSuccess.agent_department || 'Customer Support'}) based on active workload balancing.
                </p>
                <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setSubmitSuccess(null);
                      setIsRaiseModalOpen(false);
                    }}
                  >
                    Close
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setSubmitSuccess(null);
                      openTicketDetails(submitSuccess);
                      setIsRaiseModalOpen(false);
                    }}
                  >
                    View Status & Conversation
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRaiseComplaint}>
                <div className="modal-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 0.85rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', fontSize: '0.8rem', color: '#065f46', marginBottom: '0.85rem' }}>
                    <ShieldCheck size={16} />
                    <span>
                      <strong>Smart Workload Routing:</strong> Your complaint will be auto-assigned to the support agent with the lowest active workload.
                    </span>
                  </div>

                  {formError && (
                    <div style={{ color: '#dc2626', background: '#fee2e2', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                      {formError}
                    </div>
                  )}

                  <div className="form-group">
                    <label>Concern Subject *</label>
                    <input
                      type="text"
                      placeholder="Brief summary of your complaint or issue..."
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label>Describe Your Concern in Detail *</label>
                    <textarea
                      rows={5}
                      placeholder="Please provide full details about what happened, steps to reproduce, or what you need assistance with..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Your Name</label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={formData.customer_name}
                        onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Your Email (for updates)</label>
                      <input
                        type="email"
                        placeholder="e.g. john@example.com"
                        value={formData.customer_email}
                        onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="Complaint">Complaint</option>
                        <option value="Billing">Billing & Payments</option>
                        <option value="Technical">Technical Issue</option>
                        <option value="Product">Product Feedback</option>
                        <option value="General">General Inquiry</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsRaiseModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Complaint'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Ticket Details & Agent Comments Viewer Modal */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                  <span className="complaint-id">Complaint #{selectedTicket.id}</span>
                  <span className={`badge badge-status-${ticketDetails?.status || selectedTicket.status}`}>
                    {(ticketDetails?.status || selectedTicket.status).replace('_', ' ')}
                  </span>
                  <span className={`badge badge-priority-${ticketDetails?.priority || selectedTicket.priority}`}>
                    {ticketDetails?.priority || selectedTicket.priority}
                  </span>
                </div>
                <h3>{ticketDetails?.subject || ticketDetails?.title || selectedTicket.title}</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  className="btn-icon"
                  title="Refresh conversation"
                  onClick={refreshSelectedTicket}
                  disabled={loadingDetails}
                >
                  <RefreshCw size={16} className={loadingDetails ? 'spin' : ''} />
                </button>
                <button className="btn-icon" onClick={() => setSelectedTicket(null)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="modal-body conversation-modal-body">
              {/* Original Concern Details */}
              <div className="original-concern-box">
                <div className="concern-box-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="avatar" style={{ backgroundColor: '#0284c7' }}>
                      <User size={14} color="#fff" />
                    </div>
                    <div>
                      <strong>{ticketDetails?.customer_name || 'Customer'}</strong>
                      <span className="concern-date">
                        Logged on {new Date(ticketDetails?.created_at || selectedTicket.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <span className="ticket-category">{ticketDetails?.category || selectedTicket.category}</span>
                </div>
                <div className="concern-text">
                  {ticketDetails?.description || selectedTicket.description || 'No description provided.'}
                </div>
              </div>

              {/* Assigned Agent Banner */}
              <div className="agent-status-banner">
                {ticketDetails?.agent_name && ticketDetails.agent_name !== 'Unassigned' ? (
                  <div className="agent-banner-assigned">
                    <div className="agent-banner-avatar" style={{ backgroundColor: ticketDetails.agent_avatar_color || '#059669' }}>
                      <Headphones size={18} color="#fff" />
                    </div>
                    <div>
                      <div className="agent-banner-name">
                        Assigned Support Agent: <strong>{ticketDetails.agent_name}</strong>
                      </div>
                      <div className="agent-banner-role">
                        {ticketDetails.agent_role || 'Customer Support Specialist'} • {ticketDetails.agent_email || ''}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="agent-banner-pending">
                    <Clock size={18} color="#b45309" />
                    <span>Your ticket is in queue and will be assigned to a support agent by the Admin shortly.</span>
                  </div>
                )}
              </div>

              {/* Discussion & Comments Thread */}
              <div className="comments-thread-section">
                <h4 className="thread-title">
                  <MessageSquare size={16} />
                  <span>Responses & Updates ({ticketDetails?.comments?.length || 0})</span>
                </h4>

                {loadingDetails ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                    <RefreshCw size={20} className="spin" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                    Loading updates...
                  </div>
                ) : !ticketDetails?.comments || ticketDetails.comments.length === 0 ? (
                  <div className="empty-comments-banner">
                    <MessageSquare size={24} style={{ color: '#94a3b8', margin: '0 auto 0.4rem', display: 'block' }} />
                    <p style={{ fontWeight: 500, color: '#475569' }}>No responses yet</p>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      When an agent responds to your complaint, their comment will appear here in real-time.
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
                                  <span>You</span>
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

                {/* Reply Form */}
                <form onSubmit={handleSendCustomerComment} className="reply-form">
                  <textarea
                    rows={3}
                    placeholder="Type a follow-up message or reply to the support agent..."
                    value={customerComment}
                    onChange={(e) => setCustomerComment(e.target.value)}
                    required
                  />
                  <div className="reply-form-actions">
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Posting as <strong>{ticketDetails?.customer_name || 'Customer'}</strong>
                    </span>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={sendingComment || !customerComment.trim()}
                    >
                      <Send size={15} />
                      <span>{sendingComment ? 'Sending...' : 'Send Reply'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedTicket(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
