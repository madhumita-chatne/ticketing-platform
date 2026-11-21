import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateDueAt } from './sla.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path (defaults to ./database.sqlite in server folder)
const dbPath = process.env.DATABASE_FILE || path.join(__dirname, '../database.sqlite');

// Initialize SQLite database instance
// SQLite is embedded directly into this process - no separate server/service is needed!
export const db = new Database(dbPath);

// Enable WAL mode for high concurrency & better write performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
export function initDatabase() {
  // Create agents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      role TEXT DEFAULT 'Support Specialist',
      department TEXT DEFAULT 'Customer Support',
      avatar_color TEXT DEFAULT '#4f46e5',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
      priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
      category TEXT DEFAULT 'General',
      assignee TEXT DEFAULT 'Unassigned',
      agent_id INTEGER,
      customer_name TEXT DEFAULT 'Customer',
      customer_email TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      due_at DATETIME,
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      author TEXT NOT NULL,
      author_role TEXT DEFAULT 'agent',
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );
  `);

  // Migrate tickets table if columns are missing
  const ticketCols = db.prepare("PRAGMA table_info(tickets)").all().map(c => c.name);
  if (!ticketCols.includes('agent_id')) {
    db.exec("ALTER TABLE tickets ADD COLUMN agent_id INTEGER REFERENCES agents(id) ON DELETE SET NULL");
  }
  if (!ticketCols.includes('customer_name')) {
    db.exec("ALTER TABLE tickets ADD COLUMN customer_name TEXT DEFAULT 'Customer'");
  }
  if (!ticketCols.includes('customer_email')) {
    db.exec("ALTER TABLE tickets ADD COLUMN customer_email TEXT DEFAULT ''");
  }
  if (!ticketCols.includes('due_at')) {
    db.exec("ALTER TABLE tickets ADD COLUMN due_at DATETIME");
  }

  const ticketsWithoutDueDate = db.prepare(
    'SELECT id, created_at, priority FROM tickets WHERE due_at IS NULL'
  ).all();
  const setDueDate = db.prepare('UPDATE tickets SET due_at = ? WHERE id = ?');
  for (const ticket of ticketsWithoutDueDate) {
    setDueDate.run(calculateDueAt(ticket.created_at, ticket.priority), ticket.id);
  }

  // Migrate comments table if author_role is missing
  const commentCols = db.prepare("PRAGMA table_info(comments)").all().map(c => c.name);
  if (!commentCols.includes('author_role')) {
    db.exec("ALTER TABLE comments ADD COLUMN author_role TEXT DEFAULT 'agent'");
  }

  // Seed default 5 agents if agents table is empty
  seedAgents();

  // Check if we need to seed initial tickets
  const countRow = db.prepare('SELECT COUNT(*) as count FROM tickets').get();
  if (countRow.count === 0 && process.env.AUTO_SEED === 'true') {
    seedDatabase();
  }
}

export function seedAgents() {
  const agentCount = db.prepare('SELECT COUNT(*) as count FROM agents').get().count;
  if (agentCount > 0) return;

  const insertAgent = db.prepare(`
    INSERT INTO agents (name, email, role, department, avatar_color)
    VALUES (?, ?, ?, ?, ?)
  `);

  const initialAgents = [
    ['Sarah Chen', 'sarah.chen@support.com', 'Technical Support Specialist', 'Technical Support', '#4f46e5'],
    ['Alex Kumar', 'alex.kumar@support.com', 'Billing & Accounts Lead', 'Billing & Accounts', '#0284c7'],
    ['David Miller', 'david.miller@support.com', 'Product Escalations Engineer', 'Product Issues', '#7c3aed'],
    ['Elena Rostova', 'elena.rostova@support.com', 'Customer Success Manager', 'VIP & Escalations', '#059669'],
    ['Maya Lin', 'maya.lin@support.com', 'General Support Specialist', 'General Inquiries', '#d97706']
  ];

  const insertMany = db.transaction((agents) => {
    for (const agent of agents) {
      insertAgent.run(...agent);
    }
  });

  insertMany(initialAgents);
  console.log('✅ 5 Agents initialized successfully.');
}

export function seedDatabase() {
  const insertTicket = db.prepare(`
    INSERT INTO tickets (title, description, status, priority, category, assignee, due_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleTickets = [
    [
      'Fix navigation bar layout on mobile screens',
      'The hamburger menu is overlapping with the logo on screens smaller than 375px wide.',
      'open',
      'high',
      'Frontend',
      'Sarah Chen'
    ],
    [
      'Optimize SQLite queries for dashboard stats',
      'Add database indexing on status and priority columns to improve aggregation query speeds.',
      'in_progress',
      'medium',
      'Backend',
      'Alex Kumar'
    ],
    [
      'Add user authentication & session management',
      'Implement JWT-based authentication for team member logins and ticket role permissions.',
      'open',
      'urgent',
      'Security',
      'David Miller'
    ],
    [
      'Resolve SSL certificate renewal warning',
      'Automated cert-manager job failed to renew wildcard domain certificate.',
      'resolved',
      'high',
      'DevOps',
      'Elena Rostova'
    ],
    [
      'Update API documentation for v1.2 release',
      'Document the new ticket filtering parameters and comment endpoints in OpenAPI specs.',
      'closed',
      'low',
      'Documentation',
      'Maya Lin'
    ]
  ];

  const insertMany = db.transaction((tickets) => {
    for (const ticket of tickets) {
      const seededAt = new Date();
      insertTicket.run(...ticket, calculateDueAt(seededAt, ticket[3]));
    }
  });

  insertMany(sampleTickets);
  console.log('✅ SQLite database initialized and seeded with 5 sample tickets.');
}
