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

### Prompt #7: Separate Paths for 3 Screens, Consumer Website & Basic Auth Protection
- **Date & Time**: `2026-11-21 12:48:57 +05:30`
- **User Prompt**:
  > *"the 3 kinds of screens - the user the admin and the agent, lets create seperate paths of the frontnend application. the user screen should be like a website with a raise a concern button. the agent and the admin screen will have a basic auth with common password ."*
- **Intent**: Separate the 3 screens into dedicated URL paths (`/` for customer website, `/admin` for admin portal, `/agent` for agent workspace), transform the user screen into a consumer-facing website with a prominent "Raise a Concern" button, and gate the Admin and Agent screens behind a clean Basic Auth barrier using a common password (`admin123`).
- **Key Modules Affected**:
  - Backend: [`server/src/routes/auth.js`](file:///Users/madhumita/ticketing-system/server/src/routes/auth.js), [`server/src/index.js`](file:///Users/madhumita/ticketing-system/server/src/index.js), [`server/.env`](file:///Users/madhumita/ticketing-system/server/.env)
  - Frontend: [`client/src/App.jsx`](file:///Users/madhumita/ticketing-system/client/src/App.jsx), [`client/src/components/UserWebsite.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/UserWebsite.jsx), [`client/src/components/AuthGate.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AuthGate.jsx), [`client/src/index.css`](file:///Users/madhumita/ticketing-system/client/src/index.css)
  - Documentation: [`KNOWLEDGE.md`](file:///Users/madhumita/ticketing-system/KNOWLEDGE.md), [`PROMPT_LOG.md`](file:///Users/madhumita/ticketing-system/PROMPT_LOG.md)
- **Actions Taken**:
  - **Backend**:
    - Created [`server/src/routes/auth.js`](file:///Users/madhumita/ticketing-system/server/src/routes/auth.js) exposing `POST /api/auth/verify` to validate the common password.
    - Set `COMMON_PASSWORD=admin123` in [`server/.env`](file:///Users/madhumita/ticketing-system/server/.env) and mounted route in Express.
  - **Path-Based Routing**:
    - Configured client router in [`client/src/App.jsx`](file:///Users/madhumita/ticketing-system/client/src/App.jsx) reading `window.location.pathname` with pushState and hash fallback:
      - `/` or `/user`: Public Consumer Website
      - `/admin`: Admin Dashboard (Auth Protected)
      - `/agent`: Agent Screen (Auth Protected)
  - **Basic Auth Gate ([AuthGate.jsx](file:///Users/madhumita/ticketing-system/client/src/components/AuthGate.jsx))**:
    - Built authentication shield requiring the common password (`admin123`).
    - Integrated show/hide password toggle, helper hint, and session persistence via `sessionStorage`.
    - Added an active authenticated session header with quick-switch links and a "Log Out" button.
  - **Consumer Website ([UserWebsite.jsx](file:///Users/madhumita/ticketing-system/client/src/components/UserWebsite.jsx))**:
    - Built a public support website with sticky navigation bar, "Raise a Concern" high-contrast CTA button, hero section with trust metrics, "How it Works" 3-step grid, live concern tracker with conversation drawer, FAQ section, and staff footer links.
  - **Verification**:
    - Verified backend auth endpoint with node script (valid and invalid passwords).
    - Verified Vite production build (`npm --prefix client run build`) with zero errors.
- **Status**: ✅ Completed successfully.

---

### Prompt #8: User Website Simplification & Element Cleanup
- **Date & Time**: `2026-11-21 13:00:17 +05:30`
- **User Prompt**:
  > *"the user screen showuld not see staff/agent button. remove Customer Support Tracker from the user screen . remove How It Works Track Concern FAQ. Also remove real time Real-Time text fromt eh screen. remove the raise concern button from teh header"*
- **Intent**: Clean up and simplify the public customer website (`/`): remove all staff/agent navigation buttons, remove "Customer Support Tracker", remove "How It Works", "Track Concern", and "FAQ" sections, remove all occurrences of the phrase "Real-Time" / "real time", and remove the "Raise a Concern" button from the header navigation bar while preserving the prominent primary "Raise a Concern" button in the hero section.
- **Key Modules Affected**:
  - Frontend: [`client/src/components/UserWebsite.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/UserWebsite.jsx)
  - Documentation: [`KNOWLEDGE.md`](file:///Users/madhumita/ticketing-system/KNOWLEDGE.md), [`PROMPT_LOG.md`](file:///Users/madhumita/ticketing-system/PROMPT_LOG.md)
- **Actions Taken**:
  - Removed the staff/agent access dropdown from the header and footer in `UserWebsite.jsx`.
  - Removed the "Raise a Concern" button from the header navbar; retained the hero CTA button.
  - Removed the "How It Works", "Customer Support Tracker", and "FAQ" sections along with their navbar links.
  - Replaced all instances of "Real-Time" with clean terminology ("Direct Support", "Direct 2-way communication").
  - Verified with case-insensitive grep that no occurrences of "real time", "tracker", "faq", "how it works", or "staff" remain on the user screen.
  - Confirmed clean production build (`npm --prefix client run build`).
- **Status**: ✅ Completed successfully.

---

### Prompt #9: Remove Admin Dashboard Access from Agent Screen
- **Date & Time**: `2026-11-21 13:04:35 +05:30`
- **User Prompt**:
  > *"agent id should not have admin dashboard button"*
- **Intent**: Ensure that the Agent Screen (`/agent`) does not display any buttons, links, or navigation options leading to the Admin Dashboard.
- **Key Modules Affected**:
  - Frontend: [`client/src/components/AuthGate.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AuthGate.jsx), [`client/src/components/AgentScreen.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AgentScreen.jsx)
  - Documentation: [`KNOWLEDGE.md`](file:///Users/madhumita/ticketing-system/KNOWLEDGE.md), [`PROMPT_LOG.md`](file:///Users/madhumita/ticketing-system/PROMPT_LOG.md)
- **Actions Taken**:
  - In `AuthGate.jsx`, restricted the "Admin Dashboard" session button so it is completely hidden when authenticated as an agent (only visible to admin sessions).
  - In `AuthGate.jsx`, removed the "Admin Portal" link from the agent login footer.
  - In `AgentScreen.jsx`, updated empty state copy to remove references to the Admin Dashboard.
  - Verified that the Agent Screen navigation is strictly limited to their own workspace, "Public Website", and "Log Out".
  - Verified clean production build (`npm --prefix client run build`).
- **Status**: ✅ Completed successfully.

---

### Prompt #10: Agent Login Selection, Hidden Password, List View Default, Sorting/Filtering, Rebranding to Homepage, Admin New Ticket Removal & Lifecycle Comments
- **Date & Time**: `2026-11-21 13:12:45 +05:30`
- **User Prompt**:
  > *"for agent workspace login ask for which agent we want to login and then the common password. the common password should not be visible on the screen. no switch Switch Agent View as the agen will be logged in. Show list view in the Tickets Assigned to section instead of the curernt card view - give options for the agent to select which kind of view they want. Also add sorting filtering of these issues based on priority, timestamp. Instead of public website button - call it homepage. Admin view doesnt need new ticket button. On reassigning of the ticket, the user should be shown a comment. same with when the status changes"*
- **Intent**: Agent workspace login requires selecting agent profile + hidden password, remove agent switcher, default list view with cards toggle, sort and filter tickets, rename all public website links to "Homepage", remove new ticket creation from Admin view, and auto-insert lifecycle comments upon ticket reassignment and status changes.
- **Key Modules Affected**:
  - Backend: [`server/src/routes/tickets.js`](file:///Users/madhumita/ticketing-system/server/src/routes/tickets.js)
  - Frontend: [`client/src/components/AuthGate.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AuthGate.jsx), [`client/src/components/AgentScreen.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AgentScreen.jsx), [`client/src/components/AdminDashboard.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AdminDashboard.jsx), [`client/src/components/Header.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/Header.jsx), [`client/src/App.jsx`](file:///Users/madhumita/ticketing-system/client/src/App.jsx), [`client/src/index.css`](file:///Users/madhumita/ticketing-system/client/src/index.css)
  - Documentation: [`KNOWLEDGE.md`](file:///Users/madhumita/ticketing-system/KNOWLEDGE.md), [`PROMPT_LOG.md`](file:///Users/madhumita/ticketing-system/PROMPT_LOG.md)
- **Actions Taken**:
  - Added agent profile selector on `/agent` login and hid all password hints and default password text.
  - Bound AgentScreen to logged-in agent and removed agent switcher dropdown.
  - Set default view in AgentScreen to List view with toggle to Cards view.
  - Added sorting (timestamp, priority) and priority filtering.
  - Renamed "Public Website" to "Homepage" everywhere.
  - Removed "New Ticket" button from Admin view.
  - Added automatic lifecycle comments in backend when status changes or ticket is reassigned.
- **Status**: ✅ Completed successfully.

---

### Prompt #11: Add Button on User Screen to Track Created Tickets
- **Date & Time**: `2026-11-21 13:53:18 +05:30`
- **User Prompt**:
  > *"add the button on the user screen to track all the tickets that the user has created"*
- **Intent**: Add an intuitive button on the customer-facing user screen (Homepage) enabling users to view and track all concerns and tickets that they have created, inspect current statuses, see assigned support specialists, and access full discussion threads.
- **Key Modules Affected**:
  - Frontend: [`client/src/components/UserWebsite.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/UserWebsite.jsx), [`client/src/index.css`](file:///Users/madhumita/ticketing-system/client/src/index.css)
  - Backend: [`server/src/routes/tickets.js`](file:///Users/madhumita/ticketing-system/server/src/routes/tickets.js)
  - Documentation: [`KNOWLEDGE.md`](file:///Users/madhumita/ticketing-system/KNOWLEDGE.md), [`PROMPT_LOG.md`](file:///Users/madhumita/ticketing-system/PROMPT_LOG.md)
- **Actions Taken**:
  - Added `ids` query parameter support in `GET /api/tickets` to allow querying a specific list of ticket IDs.
  - Added prominent **"Track All My Tickets"** buttons in both the Hero section and top Navbar.
  - Persisted created tickets in `localStorage` (`ticketflow_my_ticket_ids`).
  - Built a comprehensive tracking modal with search, status filters, email lookup, and quick link to discussion thread.
- **Status**: ✅ Completed successfully.

---

### Prompt #12: Comprehensive Validation for Raising Tickets
- **Date & Time**: `2026-11-21 13:58:20 +05:30`
- **User Prompt**:
  > *"add the validation while rasing the tickets"*
- **Intent**: Add robust, multi-layer validation (both frontend and backend) when raising tickets, providing instant visual feedback, inline field errors, character counts, and preventing invalid submissions.
- **Key Modules Affected**:
  - Frontend: [`client/src/components/UserWebsite.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/UserWebsite.jsx), [`client/src/index.css`](file:///Users/madhumita/ticketing-system/client/src/index.css)
  - Backend: [`server/src/routes/tickets.js`](file:///Users/madhumita/ticketing-system/server/src/routes/tickets.js)
  - Documentation: [`KNOWLEDGE.md`](file:///Users/madhumita/ticketing-system/KNOWLEDGE.md), [`PROMPT_LOG.md`](file:///Users/madhumita/ticketing-system/PROMPT_LOG.md)
- **Actions Taken**:
  - **Frontend Validation ([UserWebsite.jsx](file:///Users/madhumita/ticketing-system/client/src/components/UserWebsite.jsx))**:
    - **Subject**: Required, minimum 5 characters, maximum 150 characters. Dynamic character count counter (`{length}/150`).
    - **Description**: Required, minimum 15 characters, maximum 3000 characters. Dynamic character count counter (`{length}/3000`).
    - **Customer Name**: Required, minimum 2 characters, maximum 80 characters.
    - **Customer Email**: Required, RFC 5322 regex validation (`name@example.com`).
    - **Real-time On-Blur & On-Change Feedback**: Visual `input-error` red borders and inline `<span className="field-error-text">` with `<AlertCircle />` error icons directly below each invalid input.
    - **Form-Level Safety**: Prevents network request dispatch when any validation constraint is unmet, displaying a clear summary error banner.
  - **Backend Validation ([server/src/routes/tickets.js](file:///Users/madhumita/ticketing-system/server/src/routes/tickets.js))**:
    - In `POST /api/tickets`, validates:
      - Subject: Non-empty, 5 to 150 characters (400 Bad Request on failure).
      - Description: Non-empty, 15 to 3000 characters (400 Bad Request on failure).
      - Customer Name: Minimum 2 characters if provided (400 Bad Request on failure).
      - Customer Email: Regex format check if provided (400 Bad Request on failure).
      - Category: Whitelist validation against `['Complaint', 'Billing', 'Technical', 'Product', 'General']`.
      - Priority: Whitelist validation against `['low', 'medium', 'high', 'urgent']`.
      - Status: Whitelist validation against `['open', 'in_progress', 'resolved', 'closed']`.
  - **Styling ([client/src/index.css](file:///Users/madhumita/ticketing-system/client/src/index.css))**:
    - Added styles for `.input-error`, `.field-error-text`, `.field-char-count`, and `.form-label-row`.
  - **Verification**:
    - Verified Vite client compilation (`npm --prefix client run build`) with zero errors.
- **Status**: ✅ Completed successfully.

---

## 🔮 Future Prompts Log Register

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
