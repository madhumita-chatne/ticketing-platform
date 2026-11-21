import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// Helper: Find the least loaded agent based on active open & in_progress tickets
export function getLeastLoadedAgent() {
  return db.prepare(`
    SELECT 
      a.id,
      a.name,
      a.email,
      a.role,
      a.department,
      a.avatar_color,
      COUNT(CASE WHEN t.status IN ('open', 'in_progress') THEN 1 END) AS active_load,
      COUNT(t.id) AS total_assigned
    FROM agents a
    LEFT JOIN tickets t ON t.agent_id = a.id
    GROUP BY a.id
    ORDER BY active_load ASC, total_assigned ASC, a.id ASC
    LIMIT 1
  `).get();
}

// Helper: look up agent by ID or Name
function resolveAgent(agentId, assigneeName) {
  if (agentId) {
    const agent = db.prepare('SELECT id, name, role, department FROM agents WHERE id = ?').get(agentId);
    if (agent) return { agentId: agent.id, assignee: agent.name, agent };
  }
  if (assigneeName && assigneeName !== 'Unassigned') {
    const agent = db.prepare('SELECT id, name, role, department FROM agents WHERE name LIKE ?').get(assigneeName.trim());
    if (agent) return { agentId: agent.id, assignee: agent.name, agent };
  }
  return { agentId: null, assignee: assigneeName || 'Unassigned', agent: null };
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
      ids,
      sortBy = 'created_at',
      order = 'DESC'
    } = req.query;

    const conditions = [];
    const params = [];

    if (ids && String(ids).trim()) {
      const idList = String(ids)
        .split(',')
        .map((x) => Number(x.trim()))
        .filter((n) => !isNaN(n) && n > 0);
      if (idList.length > 0) {
        conditions.push(`t.id IN (${idList.map(() => '?').join(',')})`);
        params.push(...idList);
      }
    }

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

// POST /api/tickets - Create a new ticket (with intelligent load-balanced auto-assignment)
router.post('/', (req, res) => {
  try {
    const {
      title,
      subject,
      description = '',
      status = 'open',
      priority = 'medium',
      category = 'General',
      assignee,
      agent_id,
      auto_assign = true,
      customer_name = 'Customer',
      customer_email = ''
    } = req.body;

    const ticketTitle = (title || subject || '').trim();
    if (!ticketTitle) {
      return res.status(400).json({ success: false, message: 'Concern subject/title is required' });
    }
    if (ticketTitle.length < 5 || ticketTitle.length > 150) {
      return res.status(400).json({
        success: false,
        message: 'Concern subject must be between 5 and 150 characters'
      });
    }

    const ticketDesc = (description || '').trim();
    if (!ticketDesc) {
      return res.status(400).json({ success: false, message: 'Concern description is required' });
    }
    if (ticketDesc.length < 15 || ticketDesc.length > 3000) {
      return res.status(400).json({
        success: false,
        message: 'Concern description must be between 15 and 3000 characters'
      });
    }

    const custName = (customer_name || '').trim();
    if (custName && custName.length < 2) {
      return res.status(400).json({ success: false, message: 'Customer name must be at least 2 characters' });
    }

    const custEmail = (customer_email || '').trim();
    if (custEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(custEmail)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid email address (e.g. name@example.com)' });
      }
    }

    const validCategories = ['Complaint', 'Billing', 'Technical', 'Product', 'General'];
    if (category && !validCategories.includes(category.trim())) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    const validPriorities = ['low', 'medium', 'high', 'urgent'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status: must be one of ${validStatuses.join(', ')}` });
    }

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ success: false, message: `Invalid priority: must be one of ${validPriorities.join(', ')}` });
    }

    // Load-balanced Agent Assignment logic
    let targetAgentId = null;
    let targetAssignee = 'Unassigned';
    let assignedAgent = null;

    if (agent_id && agent_id !== 'auto' && agent_id !== 'unassigned') {
      const resolved = resolveAgent(agent_id, null);
      targetAgentId = resolved.agentId;
      targetAssignee = resolved.assignee;
      assignedAgent = resolved.agent;
    } else if (assignee && assignee !== 'Unassigned' && assignee !== 'auto') {
      const resolved = resolveAgent(null, assignee);
      targetAgentId = resolved.agentId;
      targetAssignee = resolved.assignee;
      assignedAgent = resolved.agent;
    } else if (auto_assign !== false) {
      // Find the least loaded agent (lowest active 'open' + 'in_progress' tickets)
      const leastLoaded = getLeastLoadedAgent();
      if (leastLoaded) {
        targetAgentId = leastLoaded.id;
        targetAssignee = leastLoaded.name;
        assignedAgent = leastLoaded;
      }
    }

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
      targetAssignee,
      targetAgentId,
      customer_name.trim() || 'Customer',
      customer_email.trim()
    );

    const ticketId = result.lastInsertRowid;

    // If auto-assigned, generate an initial acknowledgment comment from the assigned agent
    if (assignedAgent && auto_assign !== false) {
      db.prepare(`
        INSERT INTO comments (ticket_id, author, author_role, content)
        VALUES (?, ?, 'agent', ?)
      `).run(
        ticketId,
        assignedAgent.name,
        `Hello ${customer_name.trim() || 'there'}! I am ${assignedAgent.name} from the ${assignedAgent.department} team. Your concern has been automatically assigned to me based on current agent workload balancing. I am reviewing your request and will assist you shortly.`
      );
    }

    const newTicket = db.prepare(`
      SELECT t.*, t.title as subject, a.name as agent_name, a.role as agent_role, a.department as agent_department
      FROM tickets t
      LEFT JOIN agents a ON a.id = t.agent_id
      WHERE t.id = ?
    `).get(ticketId);

    res.status(201).json({
      success: true,
      data: newTicket,
      auto_assigned: Boolean(assignedAgent),
      message: assignedAgent 
        ? `Ticket created and auto-assigned to ${assignedAgent.name} (${assignedAgent.department})`
        : 'Ticket created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/tickets/:id/auto-assign - Auto-assign a specific ticket to the least loaded agent
router.post('/:id/auto-assign', (req, res) => {
  try {
    const { id } = req.params;
    const ticket = db.prepare('SELECT id, title, customer_name FROM tickets WHERE id = ?').get(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const leastLoaded = getLeastLoadedAgent();
    if (!leastLoaded) {
      return res.status(400).json({ success: false, message: 'No available agents found' });
    }

    db.prepare(`
      UPDATE tickets 
      SET agent_id = ?, assignee = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(leastLoaded.id, leastLoaded.name, id);

    // Record comment about auto-assignment
    db.prepare(`
      INSERT INTO comments (ticket_id, author, author_role, content)
      VALUES (?, ?, 'agent', ?)
    `).run(
      id,
      leastLoaded.name,
      `Ticket re-assigned to ${leastLoaded.name} (${leastLoaded.department}) to balance agent workload (Current active load: ${leastLoaded.active_load}).`
    );

    const updated = db.prepare(`
      SELECT t.*, t.title as subject, a.name as agent_name, a.role as agent_role
      FROM tickets t
      LEFT JOIN agents a ON a.id = t.agent_id
      WHERE t.id = ?
    `).get(id);

    res.json({
      success: true,
      data: updated,
      message: `Ticket #${id} auto-assigned to ${leastLoaded.name} (Active load: ${leastLoaded.active_load})`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/tickets/auto-assign-all - Auto-assign all unassigned tickets to balance workload
router.post('/auto-assign-all', (req, res) => {
  try {
    const unassignedTickets = db.prepare(`
      SELECT id, title, customer_name 
      FROM tickets 
      WHERE agent_id IS NULL OR assignee = 'Unassigned'
      ORDER BY created_at ASC
    `).all();

    let assignedCount = 0;
    for (const t of unassignedTickets) {
      const leastLoaded = getLeastLoadedAgent();
      if (leastLoaded) {
        db.prepare('UPDATE tickets SET agent_id = ?, assignee = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(leastLoaded.id, leastLoaded.name, t.id);
        
        db.prepare(`
          INSERT INTO comments (ticket_id, author, author_role, content)
          VALUES (?, ?, 'agent', ?)
        `).run(t.id, leastLoaded.name, `Ticket auto-assigned to ${leastLoaded.name} to balance agent workload.`);
        assignedCount++;
      }
    }

    res.json({
      success: true,
      assignedCount,
      message: `Successfully auto-assigned ${assignedCount} ticket(s) across agents.`
    });
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

    let statusChanged = false;
    let oldStatus = ticket.status;
    if (status !== undefined) {
      const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      updates.push('status = ?');
      params.push(status);
      if (status !== oldStatus) {
        statusChanged = true;
      }
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
    let assignmentChanged = false;
    let finalAssignee = ticket.assignee;
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

      if (targetAgentId !== ticket.agent_id || targetAssignee !== ticket.assignee) {
        assignmentChanged = true;
        finalAssignee = targetAssignee;
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

    // Auto-generate comment on status change
    if (statusChanged) {
      const oldFmt = oldStatus.replace('_', ' ');
      const newFmt = status.replace('_', ' ');
      const updater = finalAssignee !== 'Unassigned' ? finalAssignee : 'Support System';
      db.prepare(`
        INSERT INTO comments (ticket_id, author, author_role, content)
        VALUES (?, ?, 'agent', ?)
      `).run(id, updater, `Ticket status updated from '${oldFmt}' to '${newFmt}'.`);
    }

    // Auto-generate comment on re-assignment
    if (assignmentChanged) {
      db.prepare(`
        INSERT INTO comments (ticket_id, author, author_role, content)
        VALUES (?, ?, 'agent', ?)
      `).run(
        id,
        finalAssignee !== 'Unassigned' ? finalAssignee : 'Support Desk',
        finalAssignee !== 'Unassigned'
          ? `Ticket reassigned to ${finalAssignee}.`
          : 'Ticket unassigned and returned to queue.'
      );
    }

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

// POST /api/tickets/:id/assign - Manual assign ticket to a specific agent
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
    let assignedDepartment = '';

    if (targetId && targetId !== 'unassigned') {
      const agent = db.prepare('SELECT id, name, department FROM agents WHERE id = ?').get(targetId);
      if (!agent) {
        return res.status(400).json({ success: false, message: 'Agent not found' });
      }
      assignedAgentId = agent.id;
      assigneeName = agent.name;
      assignedDepartment = agent.department;
    }

    const wasDifferent = ticket.agent_id !== assignedAgentId;

    db.prepare(`
      UPDATE tickets 
      SET agent_id = ?, assignee = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(assignedAgentId, assigneeName, id);

    if (wasDifferent) {
      db.prepare(`
        INSERT INTO comments (ticket_id, author, author_role, content)
        VALUES (?, ?, 'agent', ?)
      `).run(
        id,
        assigneeName !== 'Unassigned' ? assigneeName : 'Support Desk',
        assigneeName !== 'Unassigned'
          ? `Ticket reassigned to ${assigneeName}${assignedDepartment ? ` (${assignedDepartment})` : ''}.`
          : 'Ticket unassigned and placed back in general queue.'
      );
    }

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

// POST /api/tickets/:id/comments - Add comment to a ticket
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
