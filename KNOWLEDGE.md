# 🧠 System Knowledge & Code Flow Guide

Welcome to the **TicketFlow Support & Complaint Tracking System** knowledge base. This document is a comprehensive guide to understanding the entire codebase, architecture, database schemas, and runtime code execution flows.

---

## 📑 Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [Database Schema & Data Model](#database-schema--data-model)
3. [Backend Code Structure & API Reference](#backend-code-structure--api-reference)
   - [3.1 Intelligent Agent Auto-Assignment Algorithm](#31-⚖️-intelligent-agent-auto-assignment-algorithm)
4. [Frontend Architecture & Portals](#frontend-architecture--portals)
5. [End-to-End Execution Flows](#end-to-end-execution-flows)
6. [Developer Cheatsheet & CLI Reference](#developer-cheatsheet--cli-reference)

---

## 1. System Architecture Overview

TicketFlow is designed around a **Single-Backend, Multi-Portal** architecture. A single Node.js Express server manages an embedded SQLite database and concurrently serves **3 distinct application interfaces** through a modern React (Vite) client.

```
                              ┌───────────────────────────────────┐
                              │     React Client (Port 5173)      │
                              │   URL Hash Routing Navigation     │
                              └─┬───────────────┬───────────────┬─┘
                                │               │               │
            ┌───────────────────┴──┐     ┌──────┴──────┐     ┌──┴──────────────────┐
            │   Customer Portal    │     │ Admin Board │     │    Agent Screen     │
            │   (http://...#customer)│   │ (http://...#admin)│ (http://...#agent)  │
            └───────────────────┬──┘     └──────┬──────┘     └──┬──────────────────┘
                                │               │               │
                                └───────────────┼───────────────┘
                                                │ REST API Calls (JSON)
                                                ▼
                              ┌───────────────────────────────────┐
                              │    Node.js Express (Port 5001)    │
                              │      /api/tickets & /api/agents   │
                              └─────────────────┬─────────────────┘
                                                │ better-sqlite3 (WAL Mode)
                                                ▼
                              ┌───────────────────────────────────┐
                              │  SQLite DB (server/database.sqlite│
                              │     agents | tickets | comments   │
                              └───────────────────────────────────┘
```

### Key Technologies
- **Frontend**: React 18, Vite 6, Lucide Icons, Pure CSS Design System.
- **Backend**: Node.js 20, Express 4, CORS, Dotenv.
- **Database**: SQLite 3 with `better-sqlite3` (Embedded in-process database, WAL mode enabled for high concurrency).

---

## 2. Database Schema & Data Model

The database file resides at [`server/database.sqlite`](file:///Users/madhumita/ticketing-system/server/database.sqlite). Schema initialization and migrations are managed in [`server/src/db.js`](file:///Users/madhumita/ticketing-system/server/src/db.js).

### Entity Relationship Diagram

```
   ┌────────────────────────────────┐
   │             AGENTS             │
   ├────────────────────────────────┤
   │ id (PK)         INTEGER        │◄──────────┐
   │ name            TEXT (UNIQUE)  │           │
   │ email           TEXT (UNIQUE)  │           │
   │ role            TEXT           │           │
   │ department      TEXT           │           │
   │ avatar_color    TEXT           │           │
   │ created_at      DATETIME       │           │
   └────────────────────────────────┘           │ (1 to Many)
                                                │ agent_id
   ┌────────────────────────────────┐           │
   │            TICKETS             │           │
   ├────────────────────────────────┤           │
   │ id (PK)         INTEGER        │           │
   │ title / subject TEXT           │           │
   │ description     TEXT           │           │
   │ status          TEXT           │           │ (open, in_progress, resolved, closed)
   │ priority        TEXT           │           │ (low, medium, high, urgent)
   │ category        TEXT           │           │ (Complaint, Billing, Technical, etc.)
   │ assignee        TEXT           │           │
   │ agent_id (FK)   INTEGER        ├───────────┘
   │ customer_name   TEXT           │
   │ customer_email  TEXT           │
   │ created_at      DATETIME       │
   │ updated_at      DATETIME       │
   └───────────────┬────────────────┘
                   │
                   │ (1 to Many, ON DELETE CASCADE)
                   │ ticket_id
                   ▼
   ┌────────────────────────────────┐
   │            COMMENTS            │
   ├────────────────────────────────┤
   │ id (PK)         INTEGER        │
   │ ticket_id (FK)  INTEGER        │
   │ author          TEXT           │
   │ author_role     TEXT           │ (agent, customer, admin)
   │ content         TEXT           │
   │ created_at      DATETIME       │
   └────────────────────────────────┘
```

### The 5 Pre-Seeded Support Agents
Upon startup, [`server/src/db.js`](file:///Users/madhumita/ticketing-system/server/src/db.js) ensures the following 5 agents are seeded:
1. **Sarah Chen** (`sarah.chen@support.com`) — *Technical Support Specialist*, Technical Support (`#4f46e5`)
2. **Alex Kumar** (`alex.kumar@support.com`) — *Billing & Accounts Lead*, Billing & Accounts (`#0284c7`)
3. **David Miller** (`david.miller@support.com`) — *Product Escalations Engineer*, Product Issues (`#7c3aed`)
4. **Elena Rostova** (`elena.rostova@support.com`) — *Customer Success Manager*, VIP & Escalations (`#059669`)
5. **Maya Lin** (`maya.lin@support.com`) — *General Support Specialist*, General Inquiries (`#d97706`)

---

## 3. Backend Code Structure & API Reference

All backend code lives in [`server/`](file:///Users/madhumita/ticketing-system/server/).

### Directory Map
```text
server/
├── .env                  # Port (5001), DATABASE_FILE, AUTO_SEED settings
├── database.sqlite       # Main SQLite file
├── src/
│   ├── index.js          # Express app entry, middleware & route mounting
│   ├── db.js             # SQLite init, schema tables, migrations & agent seeding
│   ├── clear-db.js       # Standalone script to truncate tickets & comments
│   └── routes/
│       ├── tickets.js    # CRUD, assignments, comments & metrics
│       └── agents.js     # Agent roster & per-agent workload stats
```

### Key Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check and SQLite database status |
| `GET` | `/api/agents` | List all 5 agents with assigned ticket statistics & real-time `active_load` |
| `GET` | `/api/agents/:id` | Get details and ticket list for a specific agent |
| `GET` | `/api/tickets` | Query tickets. Filters: `status`, `priority`, `category`, `agent_id`, `search`, `customer_email` |
| `GET` | `/api/tickets/stats` | Aggregated metrics for status and priority counts |
| `GET` | `/api/tickets/:id` | Get ticket with agent details and full comments thread |
| `POST`| `/api/tickets` | Create ticket with **intelligent auto-assignment** to the least loaded agent |
| `PATCH`| `/api/tickets/:id`| Update ticket properties (status, priority, assignee, agent_id) |
| `POST`| `/api/tickets/:id/assign` | Manual assign ticket to a specific agent: `{ agent_id }` |
| `POST`| `/api/tickets/:id/auto-assign` | Auto-assign specific ticket to the least loaded agent |
| `POST`| `/api/tickets/auto-assign-all` | Auto-assign all unassigned tickets to balance agent workloads |
| `POST`| `/api/tickets/:id/comments` | Post comment: `{ author, author_role, content }` |
| `DELETE`| `/api/tickets/:id` | Delete ticket and its associated comments |

---

## 3.1 ⚖️ Intelligent Agent Auto-Assignment Algorithm

To guarantee that no support specialist is overloaded while others remain idle, TicketFlow implements a **Dynamic Least-Loaded Auto-Assignment Algorithm** in [`server/src/routes/tickets.js`](file:///Users/madhumita/ticketing-system/server/src/routes/tickets.js).

### Workload Definition
An agent's **Active Load** is defined as the count of tickets currently in an active state:
$$\text{Active Load} = \sum (\text{status} \in \{\text{'open'}, \text{'in\_progress'}\})$$
Tickets in `'resolved'` or `'closed'` status do not count against an agent's active load.

### Load Balancing Query
```sql
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
LIMIT 1;
```

### Multi-Tier Tie-Breaking
1. **Tier 1 (Lowest Active Load)**: Selects the agent with the fewest unresolved (`open` or `in_progress`) tickets.
2. **Tier 2 (Lowest Historical Load)**: If multiple agents have the same active load (e.g. 0 active tickets), breaks ties by picking whoever has handled fewer total lifetime tickets.
3. **Tier 3 (Round-Robin ID)**: Ensures deterministic, round-robin assignment when all metrics are equal.

### Immediate Customer Greeting
Upon auto-assignment, the system automatically posts an initial acknowledgment comment from the assigned agent into the ticket's conversation thread:
> *"Hello [Customer Name]! I am [Agent Name] from the [Department] team. Your concern has been automatically assigned to me based on current agent workload balancing. I am reviewing your request and will assist you shortly."*

---

## 4. Frontend Architecture & Portals

The frontend is built with React 18 and Vite in [`client/`](file:///Users/madhumita/ticketing-system/client/).

### Component Hierarchy
```text
App.jsx (Root coordinator, hash-routing & state sync)
├── PortalNav.jsx (Top navigation bar switching Customer/Admin/Agent)
│
├── CustomerPortal.jsx (when #customer)
│   ├── "Raise a Complaint" Modal Dialog
│   ├── Complaints List & Tracking Grid
│   └── Complaint Conversation Modal (Original concern + Agent comments + User reply box)
│
├── AdminDashboard.jsx (when #admin)
│   ├── Header.jsx (New ticket button, manual refresh)
│   ├── Agents Roster Bar (5 active agents with ticket count badges)
│   ├── StatCard.jsx (Total, Open, In Progress, Resolved counters)
│   ├── FilterBar.jsx (Search, Agent filter, Status, Priority, Category, View toggle)
│   ├── Kanban View / Table View
│   │   └── TicketCard.jsx (With inline agent assignment select & comments pill)
│   └── TicketModal.jsx (Create / Edit ticket & view internal discussion)
│
└── AgentScreen.jsx (when #agent)
    ├── Agent Profile Banner (Active agent switcher dropdown & department badge)
    ├── Agent Metrics Row (Assigned, Open, In Progress, Resolved)
    ├── Filterable Assigned Tickets Grid
    └── Ticket Investigation Drawer
        ├── Quick Status Updater (In Progress, Resolved, Reopen, Close)
        ├── Conversation History Thread
        └── Agent Comment Box ("Post Response to Customer")
```

### URL Hash Routing
Navigation state is bidirectionally linked with `window.location.hash`:
- [`http://localhost:5173/#customer`](http://localhost:5173/#customer) -> Customer Support Portal
- [`http://localhost:5173/#admin`](http://localhost:5173/#admin) -> Admin Kanban & Table Dashboard
- [`http://localhost:5173/#agent`](http://localhost:5173/#agent) -> Agent Workspace

---

## 5. End-to-End Execution Flows

### Flow 1: Customer Raises a Complaint (with Auto-Assignment)
1. **User Action**: On the Customer Portal, user clicks **"Raise a Complaint"**.
2. **Input Form**: User fills in **Subject** (`"Unable to download invoice"`), **Concern Details** (`"Getting 500 error on dashboard"`), Name (`"Emma Watson"`), Email (`"emma@example.com"`).
3. **HTTP Request**: Frontend dispatches `POST /api/tickets` with:
   ```json
   {
     "title": "Unable to download invoice",
     "subject": "Unable to download invoice",
     "description": "Getting 500 error on dashboard",
     "customer_name": "Emma Watson",
     "customer_email": "emma@example.com",
     "status": "open",
     "auto_assign": true
   }
   ```
4. **Backend Processing**:
   - `getLeastLoadedAgent()` determines which of the 5 agents has the lowest active workload (e.g. **Sarah Chen** with `active_load: 0`).
   - Executes:
     ```sql
     INSERT INTO tickets (title, description, customer_name, customer_email, status, assignee, agent_id)
     VALUES (?, ?, ?, ?, 'open', 'Sarah Chen', 1);
     
     INSERT INTO comments (ticket_id, author, author_role, content)
     VALUES (?, 'Sarah Chen', 'agent', 'Hello Emma Watson! I am Sarah Chen from the Technical Support team. Your concern has been automatically assigned to me based on current agent workload balancing. I am reviewing your request and will assist you shortly.');
     ```
5. **Instant Feedback**: The Customer Portal modal displays confirmation:
   > *"Complaint #X Submitted & Auto-Assigned to Sarah Chen (Technical Support)!"*
   The complaint immediately displays in the Customer Portal list with Sarah Chen assigned, and appears in the Admin Dashboard with an active workload indicator.

---

### Flow 2: Admin Assigns Complaint to Agent
1. **User Action**: Admin opens [http://localhost:5173/#admin](http://localhost:5173/#admin).
2. **Assignment Dropdown**: On the ticket's Kanban card or in the Table row, Admin selects **Alex Kumar** from the agent dropdown.
3. **HTTP Request**: Frontend dispatches `POST /api/tickets/:id/assign` with `{ "agent_id": 2 }`.
4. **Backend Processing**:
   - Resolves Agent ID `2` to `"Alex Kumar"`.
   - Executes:
     ```sql
     UPDATE tickets SET agent_id = 2, assignee = 'Alex Kumar', updated_at = CURRENT_TIMESTAMP WHERE id = ?;
     ```
5. **State Update**: Both the Admin view and the Agent Screen for Alex Kumar refresh to display the newly assigned ticket.

---

### Flow 3: Agent Investigates & Posts a Comment
1. **User Action**: Agent opens [http://localhost:5173/#agent](http://localhost:5173/#agent) and selects their profile (**Alex Kumar**).
2. **Ticket Selection**: Agent clicks on Ticket `#ID`.
3. **Status Update**: Agent clicks **"Mark In Progress"** (`PATCH /api/tickets/:id` `{ status: 'in_progress' }`).
4. **Agent Comment**: In the comment composer, Alex types:
   > *"Hello Emma, I investigated the error and fixed your billing permissions. Could you please try again?"*
5. **HTTP Request**: Frontend dispatches `POST /api/tickets/:id/comments`:
   ```json
   {
     "author": "Alex Kumar",
     "author_role": "agent",
     "content": "Hello Emma, I investigated the error and fixed your billing permissions. Could you please try again?"
   }
   ```
6. **Backend Processing**:
   ```sql
   INSERT INTO comments (ticket_id, author, author_role, content) VALUES (?, 'Alex Kumar', 'agent', ?);
   UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?;
   ```

---

### Flow 4: Customer Views Response & Replies
1. **User Action**: Customer opens [http://localhost:5173/#customer](http://localhost:5173/#customer) and clicks their complaint.
2. **Thread Display**: The conversation modal displays the original complaint followed by Alex's comment highlighted with a distinct **Agent badge** (`🎧 Agent: Alex Kumar`).
3. **Customer Reply**: Customer inputs:
   > *"Thank you Alex, the download works now!"*
4. **HTTP Request**: Customer clicks **Send Reply** (`POST /api/tickets/:id/comments` with `author_role: 'customer'`).
5. **Resolution**: Agent sees customer's reply on the Agent Screen and clicks **"Mark Resolved"**.

---

## 6. Developer Cheatsheet & CLI Reference

### Running the Project
```bash
# Backend server (port 5001)
cd server && npm run dev

# Frontend client (port 5173)
cd client && npm run dev
```

### Database Maintenance
```bash
# Truncate all tickets and comments (keeps 5 agents intact)
npm run db:clear

# Inspect SQLite tables directly via CLI
sqlite3 server/database.sqlite ".tables"
sqlite3 server/database.sqlite "SELECT * FROM agents;"
sqlite3 server/database.sqlite "SELECT id, title, status, assignee FROM tickets;"
sqlite3 server/database.sqlite "SELECT ticket_id, author, author_role, content FROM comments;"
```
