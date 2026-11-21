import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// GET /api/tickets - List all tickets with optional search, status, and priority filtering
router.get('/', (req, res) => {
  try {
    const { status, priority, category, search, sortBy = 'created_at', order = 'DESC' } = req.query;

    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }

    if (priority && priority !== 'all') {
      conditions.push('priority = ?');
      params.push(priority);
    }

    if (category && category !== 'all') {
      conditions.push('category = ?');
      params.push(category);
    }

    if (search && search.trim()) {
      conditions.push('(title LIKE ? OR description LIKE ? OR assignee LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const safeSortBy = ['created_at', 'updated_at', 'priority', 'status', 'title'].includes(sortBy)
      ? sortBy
      : 'created_at';
    const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT * FROM tickets
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeOrder}
    `;

    const tickets = db.prepare(sql).all(...params);
    res.json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/tickets/stats - Get ticket counts grouped by status and priority
router.get('/stats', (req, res) => {
  try {
    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) as count FROM tickets GROUP BY status
    `).all();

    const priorityCounts = db.prepare(`
      SELECT priority, COUNT(*) as count FROM tickets GROUP BY priority
    `).all();

    const totalRow = db.prepare('SELECT COUNT(*) as total FROM tickets').get();

    const formattedStatus = {
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0
    };
    statusCounts.forEach(item => {
      formattedStatus[item.status] = item.count;
    });

    const formattedPriority = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    };
    priorityCounts.forEach(item => {
      formattedPriority[item.priority] = item.count;
    });

    res.json({
      success: true,
      data: {
        total: totalRow.total,
        byStatus: formattedStatus,
        byPriority: formattedPriority
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/tickets/:id - Get a single ticket with its comments
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const comments = db.prepare(`
      SELECT * FROM comments WHERE ticket_id = ? ORDER BY created_at ASC
    `).all(id);

    res.json({ success: true, data: { ...ticket, comments } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/tickets - Create a new ticket
router.post('/', (req, res) => {
  try {
    const { title, description = '', status = 'open', priority = 'medium', category = 'General', assignee = 'Unassigned' } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Ticket title is required' });
    }

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    const validPriorities = ['low', 'medium', 'high', 'urgent'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status: must be one of ${validStatuses.join(', ')}` });
    }

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ success: false, message: `Invalid priority: must be one of ${validPriorities.join(', ')}` });
    }

    const stmt = db.prepare(`
      INSERT INTO tickets (title, description, status, priority, category, assignee)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(title.trim(), description.trim(), status, priority, category.trim(), assignee.trim());
    const newTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ success: true, data: newTicket, message: 'Ticket created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/tickets/:id - Update ticket details
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const allowedFields = ['title', 'description', 'status', 'priority', 'category', 'assignee'];
    const updates = [];
    const params = [];

    for (const [key, value] of Object.entries(req.body)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        params.push(typeof value === 'string' ? value.trim() : value);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    db.prepare(`UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const updatedTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    res.json({ success: true, data: updatedTicket, message: 'Ticket updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/tickets/:id - Delete a ticket
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM tickets WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    res.json({ success: true, message: `Ticket #${id} deleted successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/tickets/:id/comments - Add comment to a ticket
router.post('/:id/comments', (req, res) => {
  try {
    const { id } = req.params;
    const { author = 'Anonymous', content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const ticket = db.prepare('SELECT id FROM tickets WHERE id = ?').get(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const stmt = db.prepare(`
      INSERT INTO comments (ticket_id, author, content)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(id, author.trim(), content.trim());
    const newComment = db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ success: true, data: newComment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
