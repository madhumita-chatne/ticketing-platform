import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// GET /api/agents - List all agents with ticket statistics & active workload
router.get('/', (req, res) => {
  try {
    const agents = db.prepare(`
      SELECT 
        a.*,
        COUNT(t.id) as total_tickets,
        SUM(CASE WHEN t.status = 'open' THEN 1 ELSE 0 END) as open_tickets,
        SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tickets,
        SUM(CASE WHEN t.status IN ('open', 'in_progress') THEN 1 ELSE 0 END) as active_load,
        SUM(CASE WHEN t.status = 'resolved' THEN 1 ELSE 0 END) as resolved_tickets,
        SUM(CASE WHEN t.status = 'closed' THEN 1 ELSE 0 END) as closed_tickets
      FROM agents a
      LEFT JOIN tickets t ON t.agent_id = a.id
      GROUP BY a.id
      ORDER BY active_load ASC, a.id ASC
    `).all();

    res.json({ success: true, count: agents.length, data: agents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/agents/:id - Get a single agent and their assigned tickets
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(id);

    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    const tickets = db.prepare(`
      SELECT * FROM tickets WHERE agent_id = ? ORDER BY updated_at DESC
    `).all(id);

    res.json({ success: true, data: { ...agent, tickets } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/agents/:id/status - Set an agent as online or offline
router.patch('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['online', 'offline'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be online or offline' });
    }

    const agent = db.prepare('SELECT id, name, status FROM agents WHERE id = ?').get(id);
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    db.prepare('UPDATE agents SET status = ? WHERE id = ?').run(status, id);
    res.json({
      success: true,
      data: { ...agent, status },
      message: `${agent.name} is now ${status}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
