-- Schema for Multi-Portal Support & Complaint Tracking System

-- Agents Table (5 Pre-seeded Agents)
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

-- Tickets Table (Complaints & Support Requests)
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

-- Comments Table (Communication thread between Customer and Agents)
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    author TEXT NOT NULL,
    author_role TEXT CHECK(author_role IN ('agent', 'customer', 'admin')) DEFAULT 'agent',
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);
