# 🧠 System Knowledge & Code Flow Guide

Welcome to the **TicketFlow Support & Complaint Tracking System** knowledge base. This document is a comprehensive guide to understanding the entire codebase, architecture, database schemas, and runtime code execution flows.

---

## 📑 Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [Database Schema & Data Model](#database-schema--data-model)
3. [Backend Code Structure & API Reference](#backend-code-structure--api-reference)
   - [3.1 Intelligent Agent Auto-Assignment Algorithm](#31-⚖️-intelligent-agent-auto-assignment-algorithm)
   - [3.2 Lifecycle Audit Comments (Status & Reassignment)](#32-📝-lifecycle-audit-comments-status--reassignment)
   - [3.3 Ticket Creation Validation Rules](#33-🛡️-ticket-creation-validation-rules-frontend--backend)
4. [Frontend Architecture & Dedicated Routes](#frontend-architecture--dedicated-routes)
5. [End-to-End Execution Flows](#end-to-end-execution-flows)
6. [Developer Cheatsheet & CLI Reference](#developer-cheatsheet--cli-reference)

---

## 1. System Architecture Overview

TicketFlow is designed around a **Single-Backend, Multi-Portal** architecture. A single Node.js Express server manages an embedded SQLite database and concurrently serves **3 distinct application paths** through a modern React (Vite) client.

```
                              ┌───────────────────────────────────┐
                              │     React Client (Port 5173)      │
                              │    Dedicated Browser Path Routing │
                              └─┬───────────────┬───────────────┬─┘
                                │               │               │
            ┌───────────────────┴──┐     ┌──────┴──────┐     ┌──┴──────────────────┐
            │       Homepage       │     │ Admin Portal│     │    Agent Screen     │
            │      Path: /         │     │ Path: /admin│     │    Path: /agent     │
            │  "Raise a Concern"   │     │ (Basic Auth)│     │ (Agent Pick + Auth) │
            │  Consumer Website    │     │ [admin123]  │     │    [admin123]       │
            └───────────────────┬──┘     └──────┬──────┘     └──┬──────────────────┘
                                │               │               │
                                └───────────────┼───────────────┘
                                                │ REST API Calls (JSON)
                                                ▼
                              ┌───────────────────────────────────┐
                              │    Node.js Express (Port 5001)    │
                              │    /api/tickets, agents & auth    │
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
   │ status          TEXT           │ (online, offline)
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
3. **David Miller** (`david.miller@support.com`) — *Product Escalations Engineer*, Product Escalations (`#7c3aed`)
4. **Elena Rostova** (`elena.rostova@support.com`) — *Customer Success Manager*, Customer Success (`#059669`)
5. **Maya Lin** (`maya.lin@support.com`) — *General Support Specialist*, General Support (`#d97706`)

---

## 3. Backend Code Structure & API Reference

All backend code lives in [`server/`](file:///Users/madhumita/ticketing-system/server/).

### Directory Map
```text
server/
├── .env                  # Port (5001), DATABASE_FILE, AUTO_SEED settings, COMMON_PASSWORD
├── database.sqlite       # Main SQLite file
├── src/
│   ├── index.js          # Express app entry, middleware & route mounting
│   ├── db.js             # SQLite init, schema tables, migrations & agent seeding
│   ├── clear-db.js       # Standalone script to truncate tickets & comments
│   └── routes/
│       ├── tickets.js    # CRUD, assignments, comments, lifecycle audits & metrics
│       ├── agents.js     # Agent roster & per-agent workload stats
│       └── auth.js       # Common password verification
```

### Key Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check and SQLite database status |
| `GET` | `/api/agents` | List all 5 agents with assigned ticket statistics & real-time `active_load` |
| `GET` | `/api/agents/:id` | Get details and ticket list for a specific agent |
| `PATCH` | `/api/agents/:id/status` | Set agent availability: `{ "status": "online" \| "offline" }` |
| `GET` | `/api/tickets` | Query tickets. Filters: `ids`, `status`, `priority`, `category`, `agent_id`, `search`, `customer_email`, `sortBy`, `order` |
| `GET` | `/api/tickets/stats` | Aggregated metrics for status and priority counts |
| `GET` | `/api/tickets/:id` | Get ticket with agent details and full comments thread |
| `POST`| `/api/tickets` | Create ticket with **intelligent auto-assignment** to the least loaded agent |
| `PATCH`| `/api/tickets/:id`| Update ticket properties; automatically adds lifecycle audit comment on status or assignee change |
| `POST`| `/api/tickets/:id/assign` | Manual assign ticket to a specific agent: `{ agent_id }`; logs reassignment audit comment |
| `POST`| `/api/tickets/:id/auto-assign` | Auto-assign specific ticket to the least loaded agent |
| `POST`| `/api/tickets/auto-assign-all` | Auto-assign all unassigned tickets to balance agent workloads |
| `POST`| `/api/auth/verify` | Validate staff basic auth password for `/admin` & `/agent` |
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
  a.status,
  COUNT(CASE WHEN t.status IN ('open', 'in_progress') THEN 1 END) AS active_load,
  COUNT(t.id) AS total_assigned
FROM agents a
LEFT JOIN tickets t ON t.agent_id = a.id
WHERE a.status = 'online'
GROUP BY a.id
ORDER BY active_load ASC, total_assigned ASC, a.id ASC
LIMIT 1;
```

### Multi-Tier Tie-Breaking
1. **Tier 1 (Lowest Active Load)**: Selects the agent with the fewest unresolved (`open` or `in_progress`) tickets.
2. **Tier 2 (Lowest Historical Load)**: If multiple agents have the same active load (e.g. 0 active tickets), breaks ties by picking whoever has handled fewer total lifetime tickets.
3. **Tier 3 (Round-Robin ID)**: Ensures deterministic, round-robin assignment when all metrics are equal.

---

## 3.2 📝 Lifecycle Audit Comments (Status & Reassignment)

Whenever a ticket's status changes or it gets reassigned (whether via `PATCH /api/tickets/:id` or `POST /api/tickets/:id/assign`), the backend automatically inserts a permanent discussion comment into the ticket thread:
- **Status Change**:
  > *"Ticket status updated from '[old_status]' to '[new_status]'."*
- **Reassignment**:
  > *"Ticket reassigned to [Agent Name]."*

These comments are saved under `author_role: 'agent'` and appear in real time on the customer's portal and the agent workspace, providing total transparency to the user.

---

## 3.3 🛡️ Ticket Creation Validation Rules (Frontend & Backend)

Both the React client and the Express backend enforce strict validation rules to guarantee data integrity and provide clear user feedback:

| Field | Rules & Constraints | Error Message |
| :--- | :--- | :--- |
| **Subject / Title** | Required, 5 to 150 characters, trimmed | *"Subject must be at least 5 characters (min 5, max 150)."* |
| **Description** | Required, 15 to 3000 characters, trimmed | *"Please provide at least 15 characters describing your concern."* |
| **Customer Name** | Required, 2 to 80 characters | *"Your name is required (min 2 characters)."* |
| **Customer Email** | Required, RFC 5322 regex (`name@domain.com`) | *"Please enter a valid email address."* |
| **Category** | Allowed: `Complaint`, `Billing`, `Technical`, `Product`, `General` | *"Please select a valid category."* |
| **Priority** | Allowed: `low`, `medium`, `high`, `urgent` | *"Please select a valid priority."* |

### Interactive Client Validation Experience:
- **Real-Time On-Blur**: Individual fields validate when the user tabs or clicks away.
- **Visual Feedback**: Invalid inputs are outlined with red borders (`.input-error`) and show an error badge with an `<AlertCircle />` icon.
- **Live Character Counters**: Displays live character counts (e.g., `12/150` for subject, `45/3000` for description).
- **Submission Guard**: Blocks dispatching network requests if any validation constraint is unmet and surfaces a top-level summary banner.

---

## 4. Frontend Architecture & Dedicated Routes

The frontend is built with React 18 and Vite in [`client/`](file:///Users/madhumita/ticketing-system/client/). It implements a **dedicated path-based routing structure** where each screen serves its specific audience:

### 1. 🌐 Homepage (`/` or `/user`)
- **Component**: [`UserWebsite.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/UserWebsite.jsx)
- **Role**: Clean, focused consumer-facing website dedicated to concern intake and tracking.
- **Features**:
  - Clean Navigation bar with logo and a **"Track All My Tickets"** action button.
  - Hero section featuring the primary **"Raise a Concern"** CTA button and secondary **"Track All My Tickets"** button.
  - Value commitment cards (Fair Load Balancing, Dedicated Specialist, Direct Communication).
  - **"Raise a Concern"** modal form with automated least-loaded agent routing; newly created ticket IDs are saved to browser `localStorage` for instant tracking.
  - **"Track All Created Tickets"** modal:
    - Lists all tickets created by the user with real-time status badges, priorities, assigned specialists, and response counts.
    - Live search filter by ticket ID, subject, or keywords.
    - Status filter dropdown (`all`, `open`, `in_progress`, `resolved`, `closed`).
    - Email lookup bar to find tickets associated with any specific email address.
  - Dedicated concern details and interactive communication modal allowing direct replies from the customer.
  - Clean footer without staff portal links.

### 2. 🛡️ Admin Portal (`/admin`) — *Basic Auth Protected*
- **Component**: [`AdminDashboard.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AdminDashboard.jsx) wrapped in [`AuthGate.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AuthGate.jsx).
- **Authentication**: Requires the common password.
- **Clean Interface**: **No "New Ticket" button** is shown in the Admin view (all tickets originate directly from customer concerns on the Homepage).
- **Features**:
  - Active workload counters for all 5 support agents in the roster bar.
  - Kanban board with drag/status columns (`Open`, `In Progress`, `Resolved`, `Closed`).
  - Table view with inline agent assignment dropdowns (supports manual assignment or `⚡ Auto-Assign`).
  - "Auto-Assign All Unassigned" button to rebalance unassigned tickets in one click.

### 3. 🎧 Agent Workspace (`/agent`) — *Basic Auth Protected*
- **Component**: [`AgentScreen.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AgentScreen.jsx) wrapped in [`AuthGate.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AuthGate.jsx).
- **Login Flow**:
  - Requires selecting which agent wants to log in from a dropdown (`Sarah Chen`, `Alex Kumar`, `David Miller`, `Elena Rostova`, `Maya Lin`).
  - Requires the common password.
  - **Password is completely hidden**: no password hints or code tags are displayed anywhere on screen.
  - Remembers the logged-in agent in `sessionStorage` (`ticketflow_logged_agent_id`).
- **No Agent Switcher**:
  - The "Switch Agent View" dropdown is removed since the agent is actively authenticated into their own profile.
  - Displays a clean "Logged in as [Agent]" badge.
- **Assigned Tickets View**:
  - **Default List (Table) View**: Displays tickets in a clean, high-density tabular view with ID, Concern preview, Priority, Status, Customer, Logged At, and Reply count.
  - **View Toggle**: Agent can freely toggle between **List view** and **Cards view**.
  - **Sorting**: Dropdown to sort by **Date: Newest First**, **Date: Oldest First**, **Priority: Urgent First**, or **Priority: Low First**.
  - **Filtering**: Priority filter (`all`, `urgent`, `high`, `medium`, `low`) and status filter cards (`all`, `open`, `in_progress`, `resolved`).
- **Ticket Investigation Drawer**:
  - Status transitions (`In Progress`, `Resolved`, `Reopen`, `Close`).
  - Comment composer: responses posted by agents immediately appear on the Homepage for the customer.
- **Navigation**:
  - Button to return to **Homepage** (no Admin Portal link).

### Component Hierarchy
```text
App.jsx (Path router & global data sync)
├── / (or /user) ────────> UserWebsite.jsx
│                          ├── Clean Navbar (Brand only, no buttons)
│                          ├── Hero Section with "Raise a Concern" CTA
│                          ├── Service Commitment Cards
│                          ├── "Raise a Concern" Modal Form
│                          └── Public Website Footer
│
├── /admin ──────────────> AuthGate.jsx (Admin basic auth)
│                          └── AdminDashboard.jsx (No "New Ticket" button)
│                              ├── Header (Refresh)
│                              ├── Agents Roster Bar (Live active loads)
│                              ├── StatCard (Total, Open, In Progress, Resolved)
│                              ├── FilterBar (Search, Agent filter, Status, etc.)
│                              └── Kanban & Table Views
│
└── /agent ──────────────> AuthGate.jsx (Agent Profile Selector + Hidden Password)
                           └── AgentScreen.jsx (Bound to Logged-in Agent)
                               ├── Agent Profile & Active Badge (No switcher)
                               ├── Workload Metric Cards
                               ├── View Controls (List / Cards toggle, Sort By, Priority filter)
                               ├── Assigned Tickets View (Default: List/Table)
                               └── Ticket Modal (Status updates & comment composer)
```

---

## 5. End-to-End Execution Flows

### Flow 1: Customer Raises a Concern (with Auto-Assignment)
1. **User Action**: On the Homepage (`/`), user clicks **"Raise a Concern"** in the Hero section.
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
   - Inserts ticket and creates initial acknowledgment comment.
5. **Instant Feedback**: The modal displays confirmation:
   > *"Concern #X Submitted & Auto-Assigned to Sarah Chen (Technical Support)!"*
   The ticket appears immediately on Sarah Chen's Agent Screen in her List View.

---

### Flow 2: Ticket Status Update or Reassignment Lifecycle Comment
1. **Action**: An agent marks a ticket as `"in_progress"` or an admin reassigns it to `"Alex Kumar"`.
2. **Backend Execution**:
   - Updates the ticket row in SQLite.
   - Automatically generates a comment:
     - `Ticket status updated from 'open' to 'in progress'.`
     - `Ticket reassigned to Alex Kumar.`
3. **Thread Visibility**: Both customer on the Homepage and agents on the Agent Screen immediately see the updated activity log.

---

## 6. Developer Cheatsheet & CLI Reference

### Running the Project
```bash
# Backend server (port 5001)
cd server && npm run dev

# Frontend client (port 5173)
cd client && npm run dev
```

### Database Maintenance & Diagnostics
```bash
# Check SQLite database integrity
sqlite3 server/database.sqlite "PRAGMA integrity_check;"

# Flush WAL journal directly into main database and truncate WAL file
sqlite3 server/database.sqlite "PRAGMA wal_checkpoint(TRUNCATE);"

# Re-seed database with 5 agents, 12 tickets, and full discussion threads
npm run db:seed

# Truncate all tickets and comments (keeps 5 agents intact)
npm run db:clear

# Inspect SQLite tables directly via CLI
sqlite3 server/database.sqlite ".tables"
sqlite3 server/database.sqlite "SELECT * FROM agents;"
sqlite3 server/database.sqlite "SELECT id, title, status, assignee FROM tickets;"
sqlite3 server/database.sqlite "SELECT ticket_id, author, author_role, content FROM comments;"
```
