import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

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
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
      priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
      category TEXT DEFAULT 'General',
      assignee TEXT DEFAULT 'Unassigned',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      author TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );
  `);

  // Check if we need to seed initial tickets
  const countRow = db.prepare('SELECT COUNT(*) as count FROM tickets').get();
  if (countRow.count === 0) {
    seedDatabase();
  }
}

function seedDatabase() {
  const insertTicket = db.prepare(`
    INSERT INTO tickets (title, description, status, priority, category, assignee)
    VALUES (?, ?, ?, ?, ?, ?)
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
      insertTicket.run(...ticket);
    }
  });

  insertMany(sampleTickets);
  console.log('✅ SQLite database initialized and seeded with 5 sample tickets.');
}
