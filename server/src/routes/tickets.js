import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// Helper: look up agent by ID or Name
function resolveAgent(agentId, assigneeName) {
  if (agentId) {
    const agent = db.prepare('SELECT id, name FROM agents WHERE id = ?').get(agentId);
    if (agent) return { agentId: agent.id, assignee: agent.name };
  }
  if (assigneeName && assigneeName !== 'Unassigned') {
    const agent = db.prepare('SELECT id, name FROM agents WHERE name LIKE ?').get(assigneeName.trim());
    if (agent) return { agentId: agent.id, assignee: agent.name };
  }
  return { agentId: null, assignee: assigneeName || 'Unassigned' };
}

// GET /api/tickets - List all tickets with flexible filtering
router.get('/', (req, res) => {
  try {
    const {
      status,
      priority,
      category,
      agent_id,
      assignee,
      customer_email,
      search,
      sortBy = 'created_at',
      order = 'DESC'
    } = req.query;

    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      conditions.push('t.status = ?');
      params.push(status);
    }

    if (priority && priority !== 'all') {
      conditions.push('t.priority = ?');
      params.push(priority);
    }

    if (category && category !== 'all') {
      conditions.push('t.category = ?');
      params.push(category);
    }

    if (agent_id !== undefined && agent_id !== 'all' && agent_id !== '') {
      if (agent_id === 'unassigned' || agent_id === 'null') {
        conditions.push('(t.agent_id IS NULL OR t.assignee = "Unassigned")');
      } else {
        conditions.push('t.agent_id = ?');
        params.push(Number(agent_id));
      }
    }

    if (assignee && assignee !== 'all') {
      conditions.push('t.assignee = ?');
      params.push(assignee);
    }

    if (customer_email && customer_email.trim()) {
      conditions.push('t.customer_email = ?');
      params.push(customer_email.trim());
    }

    if (search && search.trim()) {
      conditions.push('(t.title LIKE ? OR t.description LIKE ? OR t.assignee LIKE ? OR t.customer_name LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const safeSortBy = ['created_at', 'updated_at', 'priority', 'status', 'title'].includes(sortBy)
      ? `t.${sortBy}`
      : 't.created_at';
    const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT 
        t.*,
        t.title as subject,
        a.name as agent_name,
        a.email as agent_email,
        a.role as agent_role,
        a.avatar_color as agent_avatar_color,
        (SELECT COUNT(*) FROM comments c WHERE c.ticket_id = t.id) as comments_count
      FROM tickets t
      LEFT JOIN agents a ON a.id = t.agent_id
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeOrder}
    `;

    const tickets = db.prepare(sql).all(...params);
    res.json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/tickets/stats - Aggregated ticket statistics
router.get('/stats', (req, res) => {
  try {
    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) as count FROM tickets GROUP BY status
    `).all();

    const priorityCounts = db.prepare(`
      SELECT priority, COUNT(*) as count FROM tickets GROUP BY priority
    `).all();

    const totalRow = db.prepare('SELECT COUNT(*) as total FROM tickets').get();
    const unassignedRow = db.prepare(`
      SELECT COUNT(*) as unassigned FROM tickets WHERE agent_id IS NULL OR assignee = 'Unassigned'
    `).get();

    const formattedStatus = {
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0
    };
    statusCounts.forEach((item) => {
      formattedStatus[item.status] = item.count;
    });

    const formattedPriority = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    };
    priorityCounts.forEach((item) => {
      formattedPriority[item.priority] = item.count;
    });

    res.json({
      success: true,
      data: {
        total: totalRow.total,
        unassigned: unassignedRow.unassigned,
        byStatus: formattedStatus,
        byPriority: formattedPriority
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/tickets/:id - Get single ticket with comments & agent details
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const ticket = db.prepare(`
      SELECT 
        t.*,
        t.title as subject,
        a.name as agent_name,
        a.email as agent_email,
        a.role as agent_role,
        a.avatar_color as agent_avatar_color
      FROM tickets t
      LEFT JOIN agents a ON a.id = t.agent_id
      WHERE t.id = ?
    `).get(id);

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

// POST /api/tickets - Create a new ticket (supports customer complaint or admin creation)
router.post('/', (req, res) => {
  try {
    const {
      title,
      subject,
      description = '',
      status = 'open',
      priority = 'medium',
      category = 'General',
      assignee = 'Unassigned',
      agent_id = null,
      customer_name = 'Customer',
      customer_email = ''
    } = req.body;

    const ticketTitle = (title || subject || '').trim();
    if (!ticketTitle) {
      return res.status(400).json({ success: false, message: 'Ticket title/subject is required' });
    }

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    const validPriorities = ['low', 'medium', 'high', 'urgent'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status: must be one of ${validStatuses.join(', ')}` });
    }

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ success: false, message: `Invalid priority: must be one of ${validPriorities.join(', ')}` });
    }

    // Resolve agent assignment
    const { agentId, assignee: resolvedAssignee } = resolveAgent(agent_id, assignee);

    const stmt = db.prepare(`
      INSERT INTO tickets (title, description, status, priority, category, assignee, agent_id, customer_name, customer_email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      ticketTitle,
      description.trim(),
      status,
      priority,
      category.trim(),
      resolvedAssignee,
      agentId,
      customer_name.trim() || 'Customer',
      customer_email.trim()
    );

    const newTicket = db.prepare(`
      SELECT t.*, t.title as subject, a.name as agent_name, a.role as agent_role
      FROM tickets t
      LEFT JOIN agents a ON a.id = t.agent_id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ success: true, data: newTicket, message: 'Ticket created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/tickets/:id - Update ticket details (status, assignee, priority, etc.)
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const {
      title,
      subject,
      description,
      status,
      priority,
      category,
      assignee,
      agent_id,
      customer_name,
      customer_email
    } = req.body;

    const updates = [];
    const params = [];

    const effectiveTitle = title !== undefined ? title : subject;
    if (effectiveTitle !== undefined) {
      updates.push('title = ?');
      params.push(effectiveTitle.trim());
    }

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description.trim());
    }

    if (status !== undefined) {
      const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      updates.push('status = ?');
      params.push(status);
    }

    if (priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({ success: false, message: 'Invalid priority' });
      }
      updates.push('priority = ?');
      params.push(priority);
    }

    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category.trim());
    }

    if (customer_name !== undefined) {
      updates.push('customer_name = ?');
      params.push(customer_name.trim());
    }

    if (customer_email !== undefined) {
      updates.push('customer_email = ?');
      params.push(customer_email.trim());
    }

    // Handle agent/assignee assignment update
    if (agent_id !== undefined || assignee !== undefined) {
      let targetAgentId = agent_id !== undefined ? agent_id : ticket.agent_id;
      let targetAssignee = assignee !== undefined ? assignee : ticket.assignee;

      if (agent_id !== undefined) {
        if (!agent_id || agent_id === 'unassigned' || agent_id === null) {
          targetAgentId = null;
          targetAssignee = 'Unassigned';
        } else {
          const agent = db.prepare('SELECT id, name FROM agents WHERE id = ?').get(agent_id);
          if (agent) {
            targetAgentId = agent.id;
            targetAssignee = agent.name;
          }
        }
      } else if (assignee !== undefined) {
        if (!assignee || assignee === 'Unassigned') {
          targetAgentId = null;
          targetAssignee = 'Unassigned';
        } else {
          const agent = db.prepare('SELECT id, name FROM agents WHERE name LIKE ?').get(assignee.trim());
          if (agent) {
            targetAgentId = agent.id;
            targetAssignee = agent.name;
          }
        }
      }

      updates.push('agent_id = ?', 'assignee = ?');
      params.push(targetAgentId, targetAssignee);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    db.prepare(`UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const updatedTicket = db.prepare(`
      SELECT t.*, t.title as subject, a.name as agent_name, a.role as agent_role, a.avatar_color as agent_avatar_color
      FROM tickets t
      LEFT JOIN agents a ON a.id = t.agent_id
      WHERE t.id = ?
    `).get(id);

    res.json({ success: true, data: updatedTicket, message: 'Ticket updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/tickets/:id/assign - Quick assign ticket to an agent
router.post('/:id/assign', (req, res) => {
  try {
    const { id } = req.params;
    const { agent_id, agentId } = req.body;
    const targetId = agent_id !== undefined ? agent_id : agentId;

    const ticket = db.prepare('SELECT id FROM tickets WHERE id = ?').get(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    let assignedAgentId = null;
    let assigneeName = 'Unassigned';

    if (targetId && targetId !== 'unassigned') {
      const agent = db.prepare('SELECT id, name FROM agents WHERE id = ?').get(targetId);
      if (!agent) {
        return res.status(400).json({ success: false, message: 'Agent not found' });
      }
      assignedAgentId = agent.id;
      assigneeName = agent.name;
    }

    db.prepare(`
      UPDATE tickets 
      SET agent_id = ?, assignee = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(assignedAgentId, assigneeName, id);

    const updated = db.prepare(`
      SELECT t.*, t.title as subject, a.name as agent_name, a.role as agent_role
      FROM tickets t
      LEFT JOIN agents a ON a.id = t.agent_id
      WHERE t.id = ?
    `).get(id);

    res.json({ success: true, data: updated, message: `Ticket #${id} assigned to ${assigneeName}` });
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

// POST /api/tickets/:id/comments - Add comment to a ticket (from Agent, Customer, or Admin)
router.post('/:id/comments', (req, res) => {
  try {
    const { id } = req.params;
    const { author = 'Agent', author_role = 'agent', content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const ticket = db.prepare('SELECT id, status FROM tickets WHERE id = ?').get(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const stmt = db.prepare(`
      INSERT INTO comments (ticket_id, author, author_role, content)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(id, author.trim(), author_role, content.trim());
    
    // Also update ticket updated_at
    db.prepare('UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);

    const newComment = db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ success: true, data: newComment, message: 'Comment posted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
