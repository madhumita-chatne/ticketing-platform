# 🎫 TicketFlow - Multi-Portal Ticket & Complaint Tracking System

A full-stack support and complaint tracking system built with **React** (Vite), **Node.js** (Express), and an embedded **SQLite** database. It features **3 dedicated frontend applications** connected to the same backend:

1. 👤 **Customer Portal**: For end-users to raise complaints (subject & description), track status, and view agent responses in real time.
2. 🛡️ **Admin Dashboard**: Full Kanban & Table dashboard with real-time stats and controls to assign tickets to any of the 5 agents.
3. 🎧 **Agent Screen**: Workspace for support agents to inspect assigned tickets, update resolution status, and post responses that immediately appear on the customer portal.

---

## 👥 The 5 Support Agents
The SQLite database comes with 5 pre-seeded support agents:
1. **Sarah Chen** — *Technical Support Specialist* (Technical Support)
2. **Alex Kumar** — *Billing & Accounts Lead* (Billing & Accounts)
3. **David Miller** — *Product Escalations Engineer* (Product Issues)
4. **Elena Rostova** — *Customer Success Manager* (VIP & Escalations)
5. **Maya Lin** — *General Support Specialist* (General Inquiries)

---

## 🗄️ Database Schema (`database.sqlite`)

### 1. `agents` Table
```sql
CREATE TABLE agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    role TEXT DEFAULT 'Support Specialist',
    department TEXT DEFAULT 'Customer Support',
    avatar_color TEXT DEFAULT '#4f46e5',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. `tickets` Table
```sql
CREATE TABLE tickets (
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
```

### 3. `comments` Table
```sql
CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    author TEXT NOT NULL,
    author_role TEXT CHECK(author_role IN ('agent', 'customer', 'admin')) DEFAULT 'agent',
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);
```

---

## 🚀 Running the Applications

### Frontend Application
Open [http://localhost:5173](http://localhost:5173) in your browser. Use the top navigation bar or direct hash links to access each portal:

| Portal | Direct Link | Purpose |
|---|---|---|
| **Customer Portal** | [http://localhost:5173/#customer](http://localhost:5173/#customer) | Raise complaints, track tickets, view agent comments |
| **Admin Dashboard** | [http://localhost:5173/#admin](http://localhost:5173/#admin) | Kanban & Table view, assign tickets to 5 agents |
| **Agent Screen** | [http://localhost:5173/#agent](http://localhost:5173/#agent) | Switch between agents, resolve tickets, add comments |

### Backend API
- **Base URL**: `http://localhost:5001`
- **Health Check**: `http://localhost:5001/api/health`
- **Tickets API**: `http://localhost:5001/api/tickets`
- **Agents API**: `http://localhost:5001/api/agents`

---

## 🔄 End-to-End Workflow

1. **Customer raises a complaint**:
   - Customer opens the **Customer Portal** and clicks **"Raise a Complaint"**.
   - Fills in **Subject**, **Description / Concern**, Name, Email, Category, and Priority.
   - The ticket is created with status `open` and assigned to `Unassigned`.

2. **Admin reviews & assigns ticket**:
   - Admin opens the **Admin Dashboard** ([http://localhost:5173/#admin](http://localhost:5173/#admin)).
   - The new complaint appears immediately in the **Open** column.
   - Admin assigns the complaint to one of the 5 agents (e.g. *Alex Kumar*) directly using the agent dropdown on the card or in the table view.

3. **Agent works on ticket & adds comments**:
   - Agent opens the **Agent Screen** ([http://localhost:5173/#agent](http://localhost:5173/#agent)).
   - Selects their profile (e.g. *Alex Kumar*).
   - Opens the assigned ticket and writes a response / update in the comment box.
   - Changes status to **In Progress** or **Resolved**.

4. **Customer sees the response**:
   - On the **Customer Portal** ([http://localhost:5173/#customer](http://localhost:5173/#customer)), the customer clicks their complaint.
   - The agent's comment is displayed prominently in real-time under **Responses & Updates** with the agent's name and role badge.
   - The customer can post follow-up replies directly.

---

## 🛠️ CLI Utilities

```bash
# Clear the database (removes all tickets & comments)
npm run db:clear

# Inspect the database with SQLite CLI
sqlite3 server/database.sqlite "SELECT * FROM agents;"
sqlite3 server/database.sqlite "SELECT * FROM tickets;"
sqlite3 server/database.sqlite "SELECT * FROM comments;"
```
