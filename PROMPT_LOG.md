# 📜 Prompt History & Future Log

This document records all prompts given to Antigravity in this repository, the actions performed, and provides a structured register to log future prompts.

---

## 📋 Prompt History

### Prompt #1: Environment Check & Server Startup
- **Date & Time**: `2026-11-21 11:39:01 +05:30`
- **User Prompt**:
  > *"run this repo if not running already"*
- **Intent**: Check if backend and frontend servers are running; if not, launch them.
- **Actions Taken**:
  - Investigated workspace structure, existing `package.json` scripts, and verified `node_modules` in `server/` and `client/`.
  - Checked port listeners on `5001` and `5173`. Found services were not running.
  - Launched backend Express server on port `5001` using `npm --prefix server run dev` as a daemon process.
  - Launched frontend Vite server on port `5173` using `npm --prefix client run dev` as a daemon process.
  - Verified endpoints `http://localhost:5001/api/health` and `http://localhost:5173`.
- **Status**: ✅ Completed successfully.

---

### Prompt #2: Clear SQLite Database
- **Date & Time**: `2026-11-21 11:42:15 +05:30`
- **User Prompt**:
  > *"clear the sqlite db"*
- **Intent**: Truncate tickets and comments in the SQLite database and prevent automatic re-seeding.
- **Actions Taken**:
  - Truncated `tickets`, `comments`, and reset `sqlite_sequence`.
  - Created standalone reset script [`server/src/clear-db.js`](file:///Users/madhumita/ticketing-system/server/src/clear-db.js).
  - Added `npm run db:clear` to `server/package.json` and root `package.json`.
  - Configured `AUTO_SEED=false` in [`server/.env`](file:///Users/madhumita/ticketing-system/server/.env) and [`server/src/db.js`](file:///Users/madhumita/ticketing-system/server/src/db.js) so restarts keep the database clean.
- **Status**: ✅ Completed successfully.

---

### Prompt #3: Database Inspection Location
- **Date & Time**: `2026-11-21 11:49:30 +05:30`
- **User Prompt**:
  > *"where is the db - i want to go in the db and see this"*
- **Intent**: Explain the SQLite file path and provide direct terminal and GUI commands to view the data.
- **Actions Taken**:
  - Explained exact local file path: [`server/database.sqlite`](file:///Users/madhumita/ticketing-system/server/database.sqlite).
  - Provided interactive CLI instructions (`sqlite3 server/database.sqlite`).
  - Provided quick query one-liners and recommended GUI viewers (SQLite Viewer extension & DB Browser for SQLite).
- **Status**: ✅ Completed successfully.

---

### Prompt #4: Multi-Portal Architecture, 5 Agents & Cross-Portal Comments
- **Date & Time**: `2026-11-21 12:02:51 +05:30`
- **User Prompt**:
  > *"lets make 3 kinds of frontend applications connected to the same backend. one is a client facing application where user can create ticket by c licking on something like raise a complaint and input their concern in the form of subject and description. then the ticket comes into the admin dashboard which is already built. here add 5 agents. from the admin UI, admin can assign tickets to any of these 5 agents. make sure to add db schema fo make sure to add db schema for these. also add an agent screen where agent can view assigned tickets to that agent and agent can add comments to the ticket. when a comment is added by the agent, it should be visible on the user facing application"*
- **Intent**: Expand the application into 3 unified frontend interfaces connected to the same backend, with 5 pre-seeded agents, ticket assignment from admin UI, and real-time cross-portal communication between agents and customers.
- **Actions Taken**:
  - **Database & Backend**:
    - Created `agents` table with 5 seeded agents (Sarah Chen, Alex Kumar, David Miller, Elena Rostova, Maya Lin).
    - Updated `tickets` table schema with `agent_id`, `customer_name`, `customer_email`, and aliased `subject`/`title`.
    - Updated `comments` table with `author_role` (`agent`, `customer`, `admin`).
    - Added [`server/src/routes/agents.js`](file:///Users/madhumita/ticketing-system/server/src/routes/agents.js) for agent queries and workload statistics.
    - Enhanced [`server/src/routes/tickets.js`](file:///Users/madhumita/ticketing-system/server/src/routes/tickets.js) with assignment endpoints and comment handling.
    - Updated [`db-scripts.sql`](file:///Users/madhumita/ticketing-system/db-scripts.sql).
  - **Frontend Applications**:
    - Built [`PortalNav.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/PortalNav.jsx) with URL hash navigation (`#customer`, `#admin`, `#agent`).
    - Built [`CustomerPortal.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/CustomerPortal.jsx) for raising complaints and viewing agent responses.
    - Enhanced [`AdminDashboard.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AdminDashboard.jsx) with 5-agent assignment dropdowns and roster bar.
    - Built [`AgentScreen.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AgentScreen.jsx) with agent selector, assigned ticket view, status changers, and comment composer.
    - Added comprehensive styles in [`client/src/index.css`](file:///Users/madhumita/ticketing-system/client/src/index.css).
    - Verified production build and executed end-to-end integration test.
- **Status**: ✅ Completed successfully.

---

### Prompt #5: Technical Knowledge Base & Prompt Log Tracking
- **Date & Time**: `2026-11-21 12:22:03 +05:30`
- **User Prompt**:
  > *"create a knowlege file for me to understand the code and code flow. also give a file that notes the promtps that i have given till now and also make notes of the prompts that I will give in the future."*
- **Intent**: Create a complete technical knowledge document and a prompt audit log tracking past and future requests.
- **Actions Taken**:
  - Created [`KNOWLEDGE.md`](file:///Users/madhumita/ticketing-system/KNOWLEDGE.md) detailing architecture, schemas, API endpoints, component trees, and code flows.
  - Created [`PROMPT_LOG.md`](file:///Users/madhumita/ticketing-system/PROMPT_LOG.md) documenting Prompts 1 through 5, with standard template for future prompts.
- **Status**: ✅ Completed successfully.

---

### Prompt #6: Intelligent Load-Balanced Agent Auto-Assignment
- **Date & Time**: `2026-11-21 12:28:22 +05:30`
- **User Prompt**:
  > *"always keep updating the knowledge and the prompt files. lets add an agent auto assign functionality. the user when creates a ticket, should be auto assigned an agent based on the number of tickets that that the agent alrady has. any agent should not be overloaded with tassk, the one who is free should be given more tasks rather than one whoc is already having more tasks."*
- **Intent**: Automatically assign incoming tickets to the support agent with the lowest active workload (`open` and `in_progress` status) to prevent any agent from being overloaded, and ensure all prompt and knowledge documentation remains continuously updated.
- **Key Modules Affected**:
  - Backend: [`server/src/routes/tickets.js`](file:///Users/madhumita/ticketing-system/server/src/routes/tickets.js), [`server/src/routes/agents.js`](file:///Users/madhumita/ticketing-system/server/src/routes/agents.js)
  - Frontend: [`CustomerPortal.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/CustomerPortal.jsx), [`AdminDashboard.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AdminDashboard.jsx), [`TicketCard.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/TicketCard.jsx), [`TicketModal.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/TicketModal.jsx), [`App.jsx`](file:///Users/madhumita/ticketing-system/client/src/App.jsx)
  - Documentation: [`KNOWLEDGE.md`](file:///Users/madhumita/ticketing-system/KNOWLEDGE.md), [`PROMPT_LOG.md`](file:///Users/madhumita/ticketing-system/PROMPT_LOG.md)
- **Actions Taken**:
  - Built `getLeastLoadedAgent()` query in `tickets.js` calculating `active_load` (`open` + `in_progress` tickets), with tie-breakers on total historical tickets and agent ID.
  - Updated `POST /api/tickets` to automatically auto-assign any new complaint/ticket to the least-loaded agent, and generate an immediate acknowledgment greeting comment from the assigned agent.
  - Added `POST /api/tickets/:id/auto-assign` to auto-balance a specific ticket.
  - Added `POST /api/tickets/auto-assign-all` to auto-assign all unassigned tickets in one click.
  - Enhanced `GET /api/agents` to return real-time `active_load` for each agent.
  - Updated Customer Portal to display auto-assignment confirmation banner and agent info upon submitting a complaint.
  - Updated Admin Dashboard to show real-time active load counters for each of the 5 agents in the roster bar, added inline "⚡ Auto-Assign (Least Loaded)" options, and added a quick "⚡ Auto-Assign All Unassigned" action button.
  - Verified load balancing across all 5 agents with automated multi-ticket tests and confirmed production build.
- **Verification & Outcome**:
  - Automated simulation verified tickets distribute evenly across all 5 agents (0 -> 1 ticket each).
  - Resolving a ticket reduces an agent's `active_load` to 0, immediately prioritizing them for incoming tickets.
- **Status**: ✅ Completed successfully.

---

## 🔮 Future Prompts Log Register

*Use this section to record any new prompts given in future sessions. Fill out the template below for each new task.*

```markdown
### Prompt #<NUMBER>: <BRIEF TITLE>
- **Date & Time**: `YYYY-MM-DD HH:MM:SS`
- **User Prompt**:
  > *"<PASTE EXACT PROMPT TEXT HERE>"*
- **Intent**: Brief description of user requirements.
- **Key Modules Affected**:
  - Backend: `server/...`
  - Frontend: `client/...`
  - Database: `server/database.sqlite`
- **Actions Taken**:
  - Step 1...
  - Step 2...
- **Verification & Outcome**:
  - Tests run / verification results.
- **Status**: [ ] Pending | [x] Completed
```
