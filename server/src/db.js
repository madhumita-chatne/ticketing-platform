import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedFullDatabase } from './seed.js';

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
      status TEXT CHECK(status IN ('online', 'offline')) DEFAULT 'online',
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

  // Migrate comments table if author_role is missing
  const commentCols = db.prepare("PRAGMA table_info(comments)").all().map(c => c.name);
  if (!commentCols.includes('author_role')) {
    db.exec("ALTER TABLE comments ADD COLUMN author_role TEXT DEFAULT 'agent'");
  }

  // Migrate agents table if status is missing
  const agentCols = db.prepare("PRAGMA table_info(agents)").all().map(c => c.name);
  if (!agentCols.includes('status')) {
    db.exec("ALTER TABLE agents ADD COLUMN status TEXT CHECK(status IN ('online', 'offline')) DEFAULT 'online'");
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
    INSERT INTO agents (name, email, role, department, avatar_color, status)
    VALUES (?, ?, ?, ?, ?, 'online')
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
  seedFullDatabase();
}
