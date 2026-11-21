import React, { useState, useEffect } from 'react';
import { X, Trash2, Headphones, MessageSquare, Send, User } from 'lucide-react';

export default function TicketModal({ isOpen, onClose, onSave, onDelete, ticket, agents = [], apiBase }) {
  const isEditing = Boolean(ticket && ticket.id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    priority: 'medium',
    status: 'open',
    agent_id: '',
    customer_name: 'Customer',
    customer_email: ''
  });

  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [adminComment, setAdminComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async (ticketId) => {
    if (!ticketId || !apiBase) return;
    try {
      setLoadingComments(true);
      const res = await fetch(`${apiBase}/${ticketId}`);
      const data = await res.json();
      if (data.success && data.data.comments) {
        setComments(data.data.comments);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (ticket) {
      setFormData({
        title: ticket.title || ticket.subject || '',
        description: ticket.description || '',
        category: ticket.category || 'General',
        priority: ticket.priority || 'medium',
        status: ticket.status || 'open',
        agent_id: ticket.agent_id ? String(ticket.agent_id) : '',
        customer_name: ticket.customer_name || 'Customer',
        customer_email: ticket.customer_email || ''
      });
      fetchComments(ticket.id);
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'General',
        priority: 'medium',
        status: 'open',
        agent_id: '',
        customer_name: 'Customer',
        customer_email: ''
      });
      setComments([]);
    }
    setError('');
    setAdminComment('');
  }, [ticket, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Ticket title/subject is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const payload = {
        ...formData,
        agent_id: formData.agent_id ? Number(formData.agent_id) : null
      };

      await onSave(payload, ticket ? ticket.id : null);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostAdminComment = async (e) => {
    e.preventDefault();
    if (!adminComment.trim() || !ticket?.id) return;

    try {
      setSendingComment(true);
      const res = await fetch(`${apiBase}/${ticket.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: 'Admin',
          author_role: 'admin',
          content: adminComment.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setAdminComment('');
        await fetchComments(ticket.id);
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSendingComment(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${isEditing ? 'modal-large' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEditing ? `Edit Ticket #${ticket.id}` : 'Create New Ticket'}</h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ color: '#dc2626', background: '#fee2e2', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label>Title / Subject *</label>
              <input
                type="text"
                placeholder="e.g. Broken navigation button or customer complaint..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Description / Concern</label>
              <textarea
                rows={3}
                placeholder="Add detailed explanation of the issue or feature..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jane Doe"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Customer Email</label>
                <input
                  type="email"
                  placeholder="e.g. jane@example.com"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Assign to Support Agent</label>
                <select
                  value={formData.agent_id}
                  onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  <option value="auto">⚡ Auto-Assign (Least Loaded Agent)</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} [{agent.status === 'offline' ? 'Offline' : 'Online'}] — {agent.department} ({agent.active_load || 0} active)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="General">General</option>
                  <option value="Complaint">Complaint</option>
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="Billing">Billing</option>
                  <option value="Technical">Technical</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Security">Security</option>
                  <option value="Documentation">Documentation</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* If Editing, display communication thread */}
            {isEditing && (
              <div className="modal-comments-section" style={{ marginTop: '1.2rem', paddingTop: '1.2rem', borderTop: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.8rem' }}>
                  <MessageSquare size={16} />
                  <span>Discussion Thread ({comments.length})</span>
                </h4>

                <div className="comments-list" style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem' }}>
                  {loadingComments ? (
                    <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b', fontSize: '0.85rem' }}>
                      Loading comments...
                    </div>
                  ) : comments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                      No comments on this ticket yet.
                    </div>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className={`comment-bubble ${c.author_role === 'agent' ? 'comment-agent' : 'comment-customer'}`}>
                        <div className="comment-header">
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{c.author} ({c.author_role})</span>
                          <span className="comment-time">{new Date(c.created_at).toLocaleString()}</span>
                        </div>
                        <div className="comment-body">{c.content}</div>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Add an internal or public comment as Admin..."
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handlePostAdminComment}
                    disabled={sendingComment || !adminComment.trim()}
                  >
                    <Send size={14} />
                    <span>Post</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            {isEditing ? (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ticket #${ticket.id}?`)) {
                    onDelete(ticket.id);
                    onClose();
                  }
                }}
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="modal-footer-right">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : isEditing ? 'Update Ticket' : 'Create Ticket'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
