import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  Headphones, 
  Send, 
  User, 
  ShieldCheck, 
  X, 
  Sparkles, 
  RefreshCw, 
  Zap, 
  Users, 
  MessageSquare, 
  LifeBuoy, 
  Search, 
  ArrowRight, 
  Filter, 
  AlertCircle,
  LayoutGrid,
  List
} from 'lucide-react';

export default function UserWebsite({ apiBase }) {
  // Modal states
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form states
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Customer reply state
  const [customerComment, setCustomerComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  // All tickets state for the bottom section
  const [trackedTickets, setTrackedTickets] = useState([]);
  const [loadingTracked, setLoadingTracked] = useState(false);
  const [trackerSearch, setTrackerSearch] = useState('');
  const [trackerStatus, setTrackerStatus] = useState('all');
  const [trackerPriority, setTrackerPriority] = useState('all');
  const [trackedViewMode, setTrackedViewMode] = useState('list');
  const [lookupEmail, setLookupEmail] = useState(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('ticketflow_my_email')) || '';
  });

  // Smooth scroll helper to navigate directly to the tickets section at the end of the screen
  const scrollToTicketsSection = () => {
    const el = document.getElementById('my-tickets-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Fetch ticket details when opening conversation modal
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
      console.error('Failed to fetch details:', err);
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
      console.error('Failed to refresh:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Fetch all tickets for the bottom section
  const fetchTrackedTickets = async (emailOverride) => {
    try {
      setLoadingTracked(true);
      const emailToUse = emailOverride !== undefined ? emailOverride : lookupEmail;
      const params = new URLSearchParams();

      if (emailToUse && emailToUse.trim()) {
        params.append('customer_email', emailToUse.trim());
      }

      const url = params.toString() ? `${apiBase}?${params.toString()}` : `${apiBase}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTrackedTickets(data.data);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoadingTracked(false);
    }
  };

  // Initial load: populate all tickets in the bottom section
  useEffect(() => {
    fetchTrackedTickets();
  }, []);

  // Validation rules
  const validateField = (name, value) => {
    switch (name) {
      case 'subject':
        if (!value || !value.trim()) {
          return 'Concern subject is required.';
        }
        if (value.trim().length < 5) {
          return `Subject must be at least 5 characters (${value.trim().length}/5).`;
        }
        if (value.trim().length > 150) {
          return `Subject cannot exceed 150 characters (${value.trim().length}/150).`;
        }
        return '';

      case 'description':
        if (!value || !value.trim()) {
          return 'Detailed description is required.';
        }
        if (value.trim().length < 15) {
          return `Please provide more detail (${value.trim().length}/15 chars minimum).`;
        }
        if (value.trim().length > 3000) {
          return 'Description cannot exceed 3000 characters.';
        }
        return '';

      case 'customer_name':
        if (!value || !value.trim()) {
          return 'Your name is required.';
        }
        if (value.trim().length < 2) {
          return 'Name must be at least 2 characters.';
        }
        if (value.trim().length > 80) {
          return 'Name cannot exceed 80 characters.';
        }
        return '';

      case 'customer_email':
        if (!value || !value.trim()) {
          return 'Email address is required for ticket tracking and updates.';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) {
          return 'Please enter a valid email address (e.g. name@example.com).';
        }
        return '';

      default:
        return '';
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const err = validateField(field, value);
      setFieldErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, formData[field]);
    setFieldErrors((prev) => ({ ...prev, [field]: err }));
  };

  const openRaiseModal = () => {
    setSubmitSuccess(null);
    setFormError('');
    setFieldErrors({});
    setTouched({});
    setIsRaiseModalOpen(true);
  };

  // Submit new complaint/concern
  const handleRaiseConcern = async (e) => {
    e.preventDefault();

    const newTouched = {
      subject: true,
      description: true,
      customer_name: true,
      customer_email: true
    };
    setTouched(newTouched);

    const errors = {
      subject: validateField('subject', formData.subject),
      description: validateField('description', formData.description),
      customer_name: validateField('customer_name', formData.customer_name),
      customer_email: validateField('customer_email', formData.customer_email)
    };
    setFieldErrors(errors);

    const hasErrors = Object.values(errors).some((err) => Boolean(err));
    if (hasErrors) {
      setFormError('Please resolve the errors highlighted below before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      const payload = {
        title: formData.subject.trim(),
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        customer_name: formData.customer_name.trim(),
        customer_email: formData.customer_email.trim(),
        category: formData.category,
        status: 'open',
        auto_assign: true
      };

      const res = await fetch(`${apiBase}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || 'Failed to submit concern');
      }

      if (formData.customer_email.trim()) {
        try {
          localStorage.setItem('ticketflow_my_email', formData.customer_email.trim());
          setLookupEmail(formData.customer_email.trim());
        } catch (e) {
          console.error(e);
        }
      }

      setSubmitSuccess(json.data);
      setFormData({
        subject: '',
        description: '',
        customer_name: '',
        customer_email: '',
        category: 'Complaint'
      });
      setFieldErrors({});
      setTouched({});

      // Refresh the tickets section so the new ticket appears immediately
      fetchTrackedTickets();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Customer replies to discussion
  const handleSendReply = async (e) => {
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
        fetchTrackedTickets();
      }
    } catch (err) {
      console.error('Failed to post reply:', err);
    } finally {
      setSendingComment(false);
    }
  };

  // Filter tickets in memory for the section
  const filteredTrackedTickets = trackedTickets.filter((t) => {
    if (trackerStatus !== 'all' && t.status !== trackerStatus) {
      return false;
    }
    if (trackerPriority !== 'all' && t.priority !== trackerPriority) {
      return false;
    }
    if (trackerSearch.trim()) {
      const q = trackerSearch.toLowerCase().trim();
      const matchId = String(t.id).includes(q);
      const matchTitle = (t.title || t.subject || '').toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      const matchAgent = (t.agent_name || t.assignee || '').toLowerCase().includes(q);
      const matchEmail = (t.customer_email || '').toLowerCase().includes(q);
      const matchCustomer = (t.customer_name || '').toLowerCase().includes(q);
      if (!matchId && !matchTitle && !matchDesc && !matchAgent && !matchEmail && !matchCustomer) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="website-root">
      {/* Public Navbar */}
      <header className="website-navbar">
        <div className="website-nav-container">
          <div className="website-brand">
            <div className="website-logo-icon">
              <LifeBuoy size={22} color="#fff" />
            </div>
            <div>
              <span className="website-logo-text">TicketFlow</span>
              <span className="website-logo-badge">Customer Support</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="website-hero" id="home">
        <div className="website-hero-wrapper">
          <div className="hero-pill">
            <Sparkles size={15} color="#38bdf8" />
            <span>Automated Workload Balancing & Fast Response</span>
          </div>

          <h1 className="hero-heading">
            Got an issue? We're here to <span className="highlight-text">listen and resolve</span>.
          </h1>

          <p className="hero-subtext">
            Submit your concern directly to our support team. Every ticket is automatically routed to the most available specialist with the lowest workload, ensuring immediate attention without backlogs.
          </p>

          <div className="hero-buttons">
            <button
              type="button"
              className="btn btn-primary hero-primary-btn"
              onClick={openRaiseModal}
            >
              <PlusCircle size={20} />
              <span>Raise a Concern</span>
            </button>

            {/* Directs user to the tickets section at the end of the screen */}
            <button
              type="button"
              className="btn btn-secondary hero-secondary-btn"
              onClick={scrollToTicketsSection}
              title="Direct down to all tickets at the end of the screen"
            >
              <Clock size={19} />
              <span>Track All My Tickets</span>
            </button>
          </div>

          {/* Metric Highlights */}
          <div className="hero-stats-row">
            <div className="hero-stat-item">
              <Zap size={20} color="#38bdf8" />
              <div>
                <div className="stat-num">Fast Routing</div>
                <div className="stat-desc">Auto-assigned to least-loaded specialist</div>
              </div>
            </div>
            <div className="hero-stat-item">
              <Users size={20} color="#34d399" />
              <div>
                <div className="stat-num">5 Specialists</div>
                <div className="stat-desc">Tech, Billing, Security & Escalations</div>
              </div>
            </div>
            <div className="hero-stat-item">
              <MessageSquare size={20} color="#fbbf24" />
              <div>
                <div className="stat-num">Direct Support</div>
                <div className="stat-desc">Direct 2-way communication with specialist</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Information Cards Section */}
      <section className="website-section" style={{ padding: '4rem 1.5rem 4rem' }}>
        <div className="section-intro" style={{ marginBottom: '2.5rem' }}>
          <span className="section-eyebrow">Dedicated Resolution</span>
          <h2>Our Commitment to Your Concerns</h2>
          <p>We believe every inquiry deserves quick, fair, and dedicated attention.</p>
        </div>

        <div className="how-it-works-grid">
          <div className="step-card">
            <div className="step-number" style={{ background: '#e0f2fe', color: '#0369a1' }}>
              <ShieldCheck size={24} />
            </div>
            <h3>Fair Load Balancing</h3>
            <p>Your concern is intelligently assigned to the specialist who has the lowest active task count, preventing delays and forgotten requests.</p>
          </div>

          <div className="step-card">
            <div className="step-number" style={{ background: '#ecfdf5', color: '#047857' }}>
              <Headphones size={24} />
            </div>
            <h3>Dedicated Specialist</h3>
            <p>One dedicated specialist takes ownership of your concern from intake to resolution, ensuring accountability and clear follow-through.</p>
          </div>

          <div className="step-card">
            <div className="step-number" style={{ background: '#fef3c7', color: '#b45309' }}>
              <CheckCircle2 size={24} />
            </div>
            <h3>Direct Communication</h3>
            <p>Exchange questions and updates directly with your assigned specialist until your concern is completely resolved.</p>
          </div>
        </div>
      </section>

      {/* ALL TICKETS SECTION AT THE END OF THE SCREEN */}
      <section className="website-tickets-section" id="my-tickets-section">
        <div className="website-tickets-container">
          <div className="section-intro" style={{ marginBottom: '2rem' }}>
            <span className="section-eyebrow">LIVE RESOLUTION TRACKER</span>
            <h2>All Raised Concerns & Tickets ({filteredTrackedTickets.length})</h2>
            <p>Track live resolution progress, see assigned specialists, and review conversation history in real time.</p>
          </div>

          {/* Interactive Toolbar */}
          <div className="website-tickets-toolbar">
            <div className="tracker-search-input" style={{ minWidth: '280px', flex: 1 }}>
              <Search size={16} className="tracker-search-icon" />
              <input
                type="text"
                placeholder="Search tickets by ID, subject, or details..."
                value={trackerSearch}
                onChange={(e) => setTrackerSearch(e.target.value)}
              />
            </div>

            <div className="tickets-filter-controls">
              {/* Status Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Filter size={14} style={{ color: '#64748b' }} />
                <select
                  className="filter-select"
                  value={trackerStatus}
                  onChange={(e) => setTrackerStatus(e.target.value)}
                  title="Filter by status"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Priority Filter */}
              <select
                className="filter-select"
                value={trackerPriority}
                onChange={(e) => setTrackerPriority(e.target.value)}
                title="Filter by priority"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              {/* Refresh Button */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => fetchTrackedTickets()}
                disabled={loadingTracked}
                title="Refresh tickets"
              >
                <RefreshCw size={14} className={loadingTracked ? 'spin' : ''} />
                <span>Refresh</span>
              </button>

              {/* View Mode Toggle (List vs Cards) */}
              <div className="view-mode-toggle">
                <button
                  type="button"
                  className={`btn-view-toggle ${trackedViewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setTrackedViewMode('list')}
                  title="Switch to List View"
                >
                  <List size={15} />
                  <span>List</span>
                </button>
                <button
                  type="button"
                  className={`btn-view-toggle ${trackedViewMode === 'cards' ? 'active' : ''}`}
                  onClick={() => setTrackedViewMode('cards')}
                  title="Switch to Card View"
                >
                  <LayoutGrid size={15} />
                  <span>Cards</span>
                </button>
              </div>
            </div>
          </div>

          {/* Optional Email Filter Bar */}
          <div className="tracker-email-lookup" style={{ marginBottom: '1.75rem' }}>
            <User size={15} style={{ color: '#0284c7' }} />
            <span>Filter to your email:</span>
            <input
              type="email"
              placeholder="e.g. yourname@example.com"
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  fetchTrackedTickets(lookupEmail);
                }
              }}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fetchTrackedTickets(lookupEmail)}
              disabled={loadingTracked}
            >
              Filter
            </button>
            {lookupEmail && (
              <button
                type="button"
                className="btn-link"
                style={{ fontSize: '0.8rem', color: '#64748b' }}
                onClick={() => {
                  setLookupEmail('');
                  fetchTrackedTickets('');
                }}
              >
                Clear Email Filter
              </button>
            )}
          </div>

          {/* Tickets Display */}
          {loadingTracked ? (
            <div className="empty-state" style={{ padding: '3.5rem 1rem' }}>
              <Clock size={36} className="spin" style={{ color: '#0284c7' }} />
              <p style={{ marginTop: '0.75rem' }}>Loading tickets...</p>
            </div>
          ) : filteredTrackedTickets.length === 0 ? (
            <div className="empty-state" style={{ padding: '3.5rem 1rem', background: '#ffffff', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <CheckCircle2 size={40} style={{ color: '#94a3b8' }} />
              <h3 style={{ fontSize: '1.2rem', margin: '0.75rem 0 0.3rem' }}>No tickets found</h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
                {trackerSearch || trackerStatus !== 'all' || trackerPriority !== 'all' || lookupEmail
                  ? 'No tickets match your search or filter criteria.'
                  : 'No tickets on record. Submit a concern above to get started.'}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={openRaiseModal}
              >
                <PlusCircle size={16} />
                <span>Raise a Concern</span>
              </button>
            </div>
          ) : trackedViewMode === 'list' ? (
            <div className="table-container">
              <table className="ticket-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>ID</th>
                    <th>Concern & Details</th>
                    <th style={{ width: '100px' }}>Priority</th>
                    <th style={{ width: '120px' }}>Status</th>
                    <th style={{ width: '160px' }}>Specialist</th>
                    <th style={{ width: '140px' }}>Logged At</th>
                    <th style={{ width: '85px' }}>Replies</th>
                    <th style={{ width: '100px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrackedTickets.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => openTicketDetails(t)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <span className="complaint-id">#{t.id}</span>
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
                      </td>
                      <td>
                        <span className={`badge badge-status-${t.status}`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        {t.agent_name && t.agent_name !== 'Unassigned' ? (
                          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{t.agent_name}</span>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#b45309' }}>Auto-assigning</span>
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
                          style={{ background: '#0284c7', borderColor: '#0284c7', padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openTicketDetails(t);
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="complaints-grid">
              {filteredTrackedTickets.map((t) => (
                <div
                  key={t.id}
                  className="complaint-card tracker-ticket-card"
                  onClick={() => openTicketDetails(t)}
                >
                  <div className="complaint-card-top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="complaint-id">#{t.id}</span>
                      <span className={`badge badge-priority-${t.priority}`}>{t.priority}</span>
                      <span className="ticket-category">{t.category}</span>
                    </div>
                    <span className={`badge badge-status-${t.status}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="complaint-subject">{t.title || t.subject}</h3>
                  <p className="complaint-concern">{t.description || 'No description provided.'}</p>

                  <div style={{ marginBottom: '0.75rem' }}>
                    {t.agent_name && t.agent_name !== 'Unassigned' ? (
                      <div className="tracker-ticket-agent-badge">
                        <Headphones size={13} />
                        <span>Specialist: <strong>{t.agent_name}</strong> ({t.agent_department || 'Support'})</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.78rem', color: '#b45309', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={12} />
                        <span>Auto-assigning to specialist</span>
                      </div>
                    )}
                  </div>

                  <div className="complaint-footer">
                    <div className="complaint-comments-badge">
                      <MessageSquare size={14} />
                      <span>{t.comments_count || 0} response{(t.comments_count || 0) === 1 ? '' : 's'}</span>
                    </div>
                    <span className="open-ticket-link">
                      View Discussion & Reply <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="website-footer">
        <div className="website-footer-content" style={{ justifyContent: 'center', textAlign: 'center' }}>
          <div className="footer-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="website-brand">
              <div className="website-logo-icon">
                <LifeBuoy size={20} color="#fff" />
              </div>
              <span className="website-logo-text" style={{ color: '#fff' }}>TicketFlow</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.6rem', maxWidth: '420px', lineHeight: 1.5 }}>
              Dedicated customer support and complaint resolution with intelligent workload balancing.
            </p>
          </div>
        </div>

        <div className="footer-bottom" style={{ justifyContent: 'center' }}>
          <span>© {new Date().getFullYear()} TicketFlow Support Systems. All rights reserved.</span>
        </div>
      </footer>

      {/* Raise a Concern Modal */}
      {isRaiseModalOpen && (
        <div className="modal-overlay" onClick={() => setIsRaiseModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div className="brand-icon" style={{ width: '34px', height: '34px', background: '#0284c7' }}>
                  <HelpCircle size={18} color="#fff" />
                </div>
                <h3>Raise a Concern / Complaint</h3>
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
                  Concern #{submitSuccess.id} Submitted & Auto-Assigned!
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                  Your concern regarding <strong>"{submitSuccess.title}"</strong> has been received and automatically assigned to support specialist{' '}
                  <strong style={{ color: '#047857' }}>{submitSuccess.agent_name || 'an available specialist'}</strong>{' '}
                  ({submitSuccess.agent_department || 'Customer Support'}) based on active workload balancing.
                </p>
                <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
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
                    View Concern Conversation
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setSubmitSuccess(null);
                      setIsRaiseModalOpen(false);
                      scrollToTicketsSection();
                    }}
                  >
                    <Clock size={16} />
                    <span>View in Tickets List Below</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRaiseConcern}>
                <div className="modal-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 0.85rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', fontSize: '0.8rem', color: '#065f46', marginBottom: '0.85rem' }}>
                    <ShieldCheck size={16} />
                    <span>
                      <strong>Smart Workload Routing:</strong> Your concern will be automatically assigned to the specialist with the lowest active workload.
                    </span>
                  </div>

                  {formError && (
                    <div style={{ color: '#dc2626', background: '#fee2e2', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '0.8rem' }}>
                      {formError}
                    </div>
                  )}

                  <div className="form-group">
                    <div className="form-label-row">
                      <label>Concern Subject *</label>
                      <span className="field-char-count">{formData.subject.length}/150</span>
                    </div>
                    <input
                      type="text"
                      className={touched.subject && fieldErrors.subject ? 'input-error' : ''}
                      placeholder="Brief summary of your issue (min 5 characters)..."
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      onBlur={() => handleBlur('subject')}
                      maxLength={150}
                      autoFocus
                    />
                    {touched.subject && fieldErrors.subject && (
                      <span className="field-error-text">
                        <AlertCircle size={13} /> {fieldErrors.subject}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <div className="form-label-row">
                      <label>Describe Your Concern in Detail *</label>
                      <span className="field-char-count">{formData.description.length}/3000</span>
                    </div>
                    <textarea
                      rows={4}
                      className={touched.description && fieldErrors.description ? 'input-error' : ''}
                      placeholder="Please provide full details about what happened, steps to reproduce, or assistance needed (min 15 characters)..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      onBlur={() => handleBlur('description')}
                      maxLength={3000}
                    />
                    {touched.description && fieldErrors.description && (
                      <span className="field-error-text">
                        <AlertCircle size={13} /> {fieldErrors.description}
                      </span>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <div className="form-label-row">
                        <label>Your Name *</label>
                        <span className="field-char-count">{formData.customer_name.length}/80</span>
                      </div>
                      <input
                        type="text"
                        className={touched.customer_name && fieldErrors.customer_name ? 'input-error' : ''}
                        placeholder="e.g. John Doe"
                        value={formData.customer_name}
                        onChange={(e) => handleInputChange('customer_name', e.target.value)}
                        onBlur={() => handleBlur('customer_name')}
                        maxLength={80}
                      />
                      {touched.customer_name && fieldErrors.customer_name && (
                        <span className="field-error-text">
                          <AlertCircle size={13} /> {fieldErrors.customer_name}
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <div className="form-label-row">
                        <label>Your Email *</label>
                        <span className="field-char-count">Required for updates</span>
                      </div>
                      <input
                        type="email"
                        className={touched.customer_email && fieldErrors.customer_email ? 'input-error' : ''}
                        placeholder="e.g. john@example.com"
                        value={formData.customer_email}
                        onChange={(e) => handleInputChange('customer_email', e.target.value)}
                        onBlur={() => handleBlur('customer_email')}
                      />
                      {touched.customer_email && fieldErrors.customer_email && (
                        <span className="field-error-text">
                          <AlertCircle size={13} /> {fieldErrors.customer_email}
                        </span>
                      )}
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
                        <option value="Billing">Billing & Invoices</option>
                        <option value="Technical">Technical Support</option>
                        <option value="Product">Product Issue</option>
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
                    {submitting ? 'Submitting & Routing...' : 'Submit Concern'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Concern Details & Conversation Modal */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                  <span className="complaint-id">Concern #{selectedTicket.id}</span>
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
                        Submitted on {new Date(ticketDetails?.created_at || selectedTicket.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <span className="ticket-category">{ticketDetails?.category || selectedTicket.category}</span>
                </div>
                <div className="concern-text">
                  {ticketDetails?.description || selectedTicket.description || 'No description provided.'}
                </div>
              </div>

              {/* Assigned Specialist Banner */}
              <div className="agent-status-banner">
                {ticketDetails?.agent_name && ticketDetails.agent_name !== 'Unassigned' ? (
                  <div className="agent-banner-assigned">
                    <div className="agent-banner-avatar" style={{ backgroundColor: ticketDetails.agent_avatar_color || '#059669' }}>
                      <Headphones size={18} color="#fff" />
                    </div>
                    <div>
                      <div className="agent-banner-name">
                        Assigned Support Specialist: <strong>{ticketDetails.agent_name}</strong>
                      </div>
                      <div className="agent-banner-role">
                        {ticketDetails.agent_role || 'Customer Support Specialist'} • {ticketDetails.agent_email || ''}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="agent-banner-pending">
                    <Clock size={18} color="#b45309" />
                    <span>Auto-assigning to an available specialist based on current workloads...</span>
                  </div>
                )}
              </div>

              {/* Discussion & Comments Thread */}
              <div className="comments-thread-section">
                <h4 className="thread-title">
                  <MessageSquare size={16} />
                  <span>Responses & Conversation ({ticketDetails?.comments?.length || 0})</span>
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
                      When your assigned specialist responds, their message will appear here.
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
                                  <span>Support Agent</span>
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

                {/* Customer Reply Form */}
                <form onSubmit={handleSendReply} className="reply-form">
                  <textarea
                    rows={3}
                    placeholder="Type a reply or question for your assigned support specialist..."
                    value={customerComment}
                    onChange={(e) => setCustomerComment(e.target.value)}
                    required
                  />
                  <div className="reply-form-actions">
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Replying as <strong>{ticketDetails?.customer_name || 'Customer'}</strong>
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
