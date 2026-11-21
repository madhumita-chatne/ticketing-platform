import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';

export default function TicketModal({ isOpen, onClose, onSave, onDelete, ticket }) {
  const isEditing = Boolean(ticket && ticket.id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    priority: 'medium',
    status: 'open',
    assignee: 'Unassigned'
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ticket) {
      setFormData({
        title: ticket.title || '',
        description: ticket.description || '',
        category: ticket.category || 'General',
        priority: ticket.priority || 'medium',
        status: ticket.status || 'open',
        assignee: ticket.assignee || 'Unassigned'
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'General',
        priority: 'medium',
        status: 'open',
        assignee: 'Unassigned'
      });
    }
    setError('');
  }, [ticket, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Ticket title is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onSave(formData, ticket ? ticket.id : null);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
              <label>Title *</label>
              <input
                type="text"
                placeholder="e.g. Button alignment on checkout page"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                rows={4}
                placeholder="Add detailed explanation of the issue or feature..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="General">General</option>
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Security">Security</option>
                  <option value="Documentation">Documentation</option>
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
                <label>Assignee</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Kumar"
                  value={formData.assignee}
                  onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                />
              </div>
            </div>
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
