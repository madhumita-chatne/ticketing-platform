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
  - Added client-side real-time on-blur and on-change validation for subject, description, name, and email with character counters and error icons.
  - Added backend validation in `POST /api/tickets` enforcing string length rules, RFC 5322 email regex, and whitelist validation for category, priority, and status.
  - Added form validation CSS feedback classes.
- **Status**: ✅ Completed successfully.

---

### Prompt #13: Direct User to End of Screen for All Tickets Instead of Modal
- **Date & Time**: `2026-11-21 14:05:06 +05:30`
- **User Prompt**:
  > *"instead of opening a modal on clicking on the track all my orders button, direct user to the end of the user screen which should have all the tickets"*
- **Intent**: Remove the popup modal on clicking the track tickets button; instead, place the full list of tickets directly at the end of the user screen (above the footer) and smoothly scroll the user down to this section when clicking the button.
- **Key Modules Affected**:
  - Frontend: [`client/src/components/UserWebsite.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/UserWebsite.jsx), [`client/src/index.css`](file:///Users/madhumita/ticketing-system/client/src/index.css)
  - Documentation: [`KNOWLEDGE.md`](file:///Users/madhumita/ticketing-system/KNOWLEDGE.md), [`PROMPT_LOG.md`](file:///Users/madhumita/ticketing-system/PROMPT_LOG.md)
- **Actions Taken**:
  - **Removed Modal**: Completely removed `isTrackerModalOpen` and the tracker modal overlay popup.
  - **In-Page Tickets Section ([UserWebsite.jsx](file:///Users/madhumita/ticketing-system/client/src/components/UserWebsite.jsx))**:
    - Created `<section className="website-tickets-section" id="my-tickets-section">` at the end of the user screen directly preceding the footer.
    - Loaded all tickets automatically on mount (`fetchTrackedTickets`).
    - Equipped the section with a live search bar, status filter dropdown, priority filter dropdown, email lookup input, and refresh button.
    - Rendered tickets in responsive complaint cards showing Ticket ID, Priority, Status, Category, Subject, Description preview, Assigned Specialist badge, timestamp, and comments count badge.
    - Maintained direct conversation drawer access when clicking any ticket card.
  - **Smooth Scrolling Navigation**:
    - Both the Hero section button and top Navbar button invoke `scrollToTicketsSection()`, smoothly scrolling the viewport directly down to the tickets section.
  - **Styling ([client/src/index.css](file:///Users/madhumita/ticketing-system/client/src/index.css))**:
    - Added styles for `.website-tickets-section`, `.website-tickets-container`, `.website-tickets-toolbar`, and `.tickets-filter-controls`.
- **Status**: ✅ Completed successfully.

---

### Prompt #14: Fix Ticket Detail Modal Colliding with Sticky Navbar
- **Date & Time**: `2026-11-21 14:19:10 +05:30`
- **User Prompt**:
  > *"opening the ticket in teh user screen makes it collide with the navbar"*
- **Intent**: Fix visual layering and layout collision where opening a ticket's detail/conversation modal caused its header to collide with and be obscured behind the sticky top navbar.
- **Key Modules Affected**:
  - Frontend: [`client/src/index.css`](file:///Users/madhumita/ticketing-system/client/src/index.css)
  - Documentation: [`KNOWLEDGE.md`](file:///Users/madhumita/ticketing-system/KNOWLEDGE.md), [`PROMPT_LOG.md`](file:///Users/madhumita/ticketing-system/PROMPT_LOG.md)
- **Actions Taken**:
  - **Z-Index Layering Fix**:
    - Increased `.modal-overlay` from `z-index: 50` to `z-index: 1000`, placing the backdrop and modal cleanly above the sticky navbar (`z-index: 100`).
  - **Viewport Clearance & Scrolling Geometry**:
    - Increased `.modal-overlay` padding from `1rem` to `2.5rem 1rem` to ensure consistent breathing room from the top and bottom of the viewport.
    - Updated `.modal-content` to use `max-height: calc(100vh - 5rem)` and `margin: auto` with enhanced drop shadow.
    - Updated `.conversation-modal-body` to `max-height: calc(100vh - 16rem)` with internal scrolling, preventing modal overflow.
  - **Verification**:
    - Verified clean Vite compilation (`npm --prefix client run build`) in 949ms.
- **Status**: ✅ Completed successfully.

---

### Prompt #15: Universal Dropdown Chevron-Down Icon Across All Screens
- **Date & Time**: `2026-11-21 14:27:00 +05:30`
- **User Prompt**:
  > *"fix the dropdown icon for everywhere on the dropdown buttons"*
- **Intent**: Fix dropdown arrows across all `<select>` dropdown controls and select buttons across the entire application so they display consistent, modern, styled Lucide chevron-down indicators instead of default unstyled browser OS controls.
- **Key Modules Affected**:
  - Frontend: [`client/src/index.css`](file:///Users/madhumita/ticketing-system/client/src/index.css), [`client/src/components/UserWebsite.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/UserWebsite.jsx), [`client/src/components/AdminDashboard.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AdminDashboard.jsx), [`client/src/components/AuthGate.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AuthGate.jsx)
  - Documentation: [`KNOWLEDGE.md`](file:///Users/madhumita/ticketing-system/KNOWLEDGE.md), [`PROMPT_LOG.md`](file:///Users/madhumita/ticketing-system/PROMPT_LOG.md)
- **Actions Taken**:
  - **Universal Select Styling in `index.css`**:
    - Applied `appearance: none; -webkit-appearance: none; -moz-appearance: none;` across all `select` elements.
    - Integrated inline SVG Lucide chevron-down icon (`stroke='#64748b'`) with smooth transition to indigo (`stroke='#4f46e5'`) on `:focus`.
    - Configured background position `right 0.75rem center`, size `14px 14px`, and `padding-right: 2.25rem !important` to eliminate text collision with the chevron.
  - **Standardized Component Classes**:
    - Styled `.filter-select`, `.form-group select`, and `.agent-select-dropdown` with consistent chevron-down backgrounds.
    - Styled compact variants (`.card-agent-select`, `select.badge`, and `.filter-select.badge`) with scaled `11px 11px` chevron-down icons, `right 0.45rem center` position, and `1.6rem` padding.
  - **Prefix & Toolbar Symmetry in `UserWebsite.jsx`**:
    - Added `<Layers size={14} />` icon wrapper to the Priority dropdown filter in `#my-tickets-section`, matching the `<Filter size={14} />` icon on the Status filter.
  - **Inline Padding Refinements**:
    - Cleaned inline padding in `AdminDashboard.jsx` (table status badge select and agent select) and `AuthGate.jsx` (agent picker) to maintain right clearance for the custom dropdown chevrons.
- **Verification**:
  - Built client successfully with `npm --prefix client run build` in 948ms.
- **Status**: ✅ Completed successfully.

---

### Prompt #13: Online/Offline Agent Availability for Auto-Assignment
- **Date & Time**: `2026-11-21 14:12:30 +05:30`
- **User Prompt**:
  > *"i want you to make one more functionality in auto-assignment. Add one more attribute in agents table as status and have either online or offline status value, default should be online. when ticket is created, auto-assignement should check if agent is online first. only the users that are online, ticket should be autoassigned within them"*
- **Intent**: Restrict automatic ticket assignment to agents whose availability status is `online`.
- **Key Modules Affected**:
  - Database: [`server/src/db.js`](file:///Users/madhumita/ticketing-system/server/src/db.js), [`db-scripts.sql`](file:///Users/madhumita/ticketing-system/db-scripts.sql)
  - Backend: [`server/src/routes/agents.js`](file:///Users/madhumita/ticketing-system/server/src/routes/agents.js), [`server/src/routes/tickets.js`](file:///Users/madhumita/ticketing-system/server/src/routes/tickets.js)
  - Frontend: [`client/src/components/AdminDashboard.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AdminDashboard.jsx), [`client/src/components/AuthGate.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AuthGate.jsx), [`client/src/App.jsx`](file:///Users/madhumita/ticketing-platform/client/src/App.jsx)
  - Documentation: [`KNOWLEDGE.md`](file:///Users/madhumita/ticketing-platform/KNOWLEDGE.md), [`PROMPT_LOG.md`](file:///Users/madhumita/ticketing-platform/PROMPT_LOG.md)
- **Actions Taken**:
  - Added an `status` column to the `agents` table with `online`/`offline` values and an `online` default.
  - Added database migration logic for existing SQLite installations.
  - Updated least-loaded agent selection to filter exclusively for `status = 'online'`.
  - Added `PATCH /api/agents/:id/status` for availability changes.
  - Added the online/offline control to the Agent workspace profile banner.
  - Set an agent online after agent login and offline after logout.
  - Updated bulk and specific auto-assignment behavior to use only online agents.
- **Status**: ✅ Completed successfully.

---

### Prompt #14: In-Page Tickets Section & Modal Clearance Fix
- **Date & Time**: `2026-11-21 14:19:10 +05:30`
- **User Prompt**:
  > *"opening the ticket in teh user screen makes it collide with the navbar"*
- **Intent**: Fix visual layering and layout collision where opening a ticket's detail/conversation modal caused its header to collide with and be obscured behind the sticky top navbar.
- **Key Modules Affected**:
  - Frontend: [`client/src/index.css`](file:///Users/madhumita/ticketing-system/client/src/index.css), [`client/src/components/UserWebsite.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/UserWebsite.jsx)
  - Documentation: [`KNOWLEDGE.md`](file:///Users/madhumita/ticketing-system/KNOWLEDGE.md), [`PROMPT_LOG.md`](file:///Users/madhumita/ticketing-system/PROMPT_LOG.md)
- **Actions Taken**:
  - **Z-Index Layering Fix**:
    - Increased `.modal-overlay` from `z-index: 50` to `z-index: 1000`, placing the backdrop and modal cleanly above the sticky navbar (`z-index: 100`).
  - **Viewport Clearance & Scrolling Geometry**:
    - Increased `.modal-overlay` padding from `1rem` to `2.5rem 1rem` to ensure consistent breathing room from the top and bottom of the viewport.
    - Updated `.modal-content` to use `max-height: calc(100vh - 5rem)` and `margin: auto` with enhanced drop shadow.
    - Updated `.conversation-modal-body` to `max-height: calc(100vh - 16rem)` with internal scrolling, preventing modal overflow.
  - **Verification**:
    - Verified clean Vite compilation (`npm --prefix client run build`) in 949ms.
- **Status**: ✅ Completed successfully.

---

### Prompt #15: Universal Dropdown Chevron-Down Icon Across All Screens
- **Date & Time**: `2026-11-21 14:27:00 +05:30`
- **User Prompt**:
  > *"fix the dropdown icon for everywhere on the dropdown buttons"*
- **Intent**: Fix dropdown arrows across all `<select>` dropdown controls and select buttons across the entire application so they display consistent, modern, styled Lucide chevron-down indicators instead of default unstyled browser OS controls.
- **Key Modules Affected**:
  - Frontend: [`client/src/index.css`](file:///Users/madhumita/ticketing-system/client/src/index.css), [`client/src/components/UserWebsite.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/UserWebsite.jsx), [`client/src/components/AdminDashboard.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AdminDashboard.jsx), [`client/src/components/AuthGate.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AuthGate.jsx)
  - Documentation: [`KNOWLEDGE.md`](file:///Users/madhumita/ticketing-system/KNOWLEDGE.md), [`PROMPT_LOG.md`](file:///Users/madhumita/ticketing-system/PROMPT_LOG.md)
- **Actions Taken**:
  - **Universal Select Styling in `index.css`**:
    - Applied `appearance: none; -webkit-appearance: none; -moz-appearance: none;` across all `select` elements.
    - Integrated inline SVG Lucide chevron-down icon (`stroke='#64748b'`) with smooth transition to indigo (`stroke='#4f46e5'`) on `:focus`.
    - Configured background position `right 0.75rem center`, size `14px 14px`, and `padding-right: 2.25rem !important` to eliminate text collision with the chevron.
  - **Standardized Component Classes**:
    - Styled `.filter-select`, `.form-group select`, and `.agent-select-dropdown` with consistent chevron-down backgrounds.
    - Styled compact variants (`.card-agent-select`, `select.badge`, and `.filter-select.badge`) with scaled `11px 11px` chevron-down icons, `right 0.45rem center` position, and `1.6rem` padding.
  - **Prefix & Toolbar Symmetry in `UserWebsite.jsx`**:
    - Added `<Layers size={14} />` icon wrapper to the Priority dropdown filter in `#my-tickets-section`, matching the `<Filter size={14} />` icon on the Status filter.
  - **Inline Padding Refinements**:
    - Cleaned inline padding in `AdminDashboard.jsx` (table status badge select and agent select) and `AuthGate.jsx` (agent picker) to maintain right clearance for the custom dropdown chevrons.
- **Verification**:
  - Built client successfully with `npm --prefix client run build` in 948ms.
- **Status**: ✅ Completed successfully.

---

### Prompt #16: Backend Server Restoration & Database Corruption Fix
- **Date & Time**: `2026-11-21 14:31:40 +05:30`
- **User Prompt**:
  > *"Could not connect to backend API. Ensure the server is running on http://localhost:5001"*
- **Intent**: Resolve backend server failure where the frontend could not reach `http://localhost:5001`.
- **Key Modules Affected**:
  - Backend: [`server/src/db.js`](file:///Users/madhumita/ticketing-system/server/src/db.js), [`server/database.sqlite`](file:///Users/madhumita/ticketing-system/server/database.sqlite)
  - Process Management: Task `task-27` (killed), Task `task-868` (spawned)
  - Documentation: [`KNOWLEDGE.md`](file:///Users/madhumita/ticketing-system/KNOWLEDGE.md), [`PROMPT_LOG.md`](file:///Users/madhumita/ticketing-system/PROMPT_LOG.md)
- **Root Cause**:
  - The SQLite database file [`server/database.sqlite`](file:///Users/madhumita/ticketing-system/server/database.sqlite) and its WAL journal experienced btree corruption (`SQLITE_CORRUPT: database disk image is malformed (11)`), causing `node --watch src/index.js` to crash on startup during table row count initialization.
- **Actions Taken**:
  - Terminated the crashed backend task (`task-27`).
  - Confirmed via `.dump` and `.recover` that no customer tickets were lost.
  - Archived corrupted database artifacts into `server/corrupt_backup/`.
  - Reinitialized fresh database instance via `initDatabase()`, automatically creating tables and seeding the 5 support agents with verified integrity (`PRAGMA integrity_check -> ok`).
  - Launched fresh backend daemon (`npm --prefix server run dev`, task `task-868`).
  - Confirmed backend server is active on `http://localhost:5001`.
- **Status**: ✅ Completed successfully.

---

### Prompt #17: Reverted SQLite Files Resolution & WAL Checkpointing
- **Date & Time**: `2026-11-21 14:35:21 +05:30`
- **User Prompt**:
  > *"i reverted some files of sqlite. fix it"*
- **Intent**: Fix SQLite database and backend server after git revert / branch checkout operations touched SQLite files.
- **Key Modules Affected**:
  - Database: [`server/database.sqlite`](file:///Users/madhumita/ticketing-system/server/database.sqlite), [`server/database.sqlite-wal`](file:///Users/madhumita/ticketing-system/server/database.sqlite-wal), [`server/src/db.js`](file:///Users/madhumita/ticketing-system/server/src/db.js)
  - Configuration: [`.gitignore`](file:///Users/madhumita/ticketing-system/.gitignore)
  - Process Management: Task `task-868` (killed), Task `task-981` (spawned)
  - Documentation: [`KNOWLEDGE.md`](file:///Users/madhumita/ticketing-system/KNOWLEDGE.md), [`PROMPT_LOG.md`](file:///Users/madhumita/ticketing-system/PROMPT_LOG.md)
- **Root Cause**:
  - `server/database.sqlite-wal` and `server/database.sqlite-shm` were previously tracked in git whereas `server/database.sqlite` was gitignored (`*.sqlite`).
  - Checking out or reverting git commits replaced the active WAL journal with an out-of-sync revision, causing SQLite write-ahead log divergence.
- **Actions Taken**:
  - Executed `PRAGMA wal_checkpoint(TRUNCATE);` to safely flush all transactions directly into [`server/database.sqlite`](file:///Users/madhumita/ticketing-system/server/database.sqlite) and truncate the WAL journal to 0 bytes.
  - Executed `initDatabase()` migration check to ensure all columns (including `status` on `agents`) exist and are populated with `online`.
  - Updated [`.gitignore`](file:///Users/madhumita/ticketing-system/.gitignore) to `*.sqlite*` and `*.db*` to protect WAL and SHM journal files from future git tracking and branch collisions.
  - Restarted backend daemon process (`npm --prefix server run dev`, task `task-981`).
  - Verified backend operation with database queries returning 5 agents and 10 tickets.
- **Status**: ✅ Completed successfully.

---

### Prompt #18: Populate SQLite Database with 5 Agents and 12 Realistic Tickets
- **Date & Time**: `2026-11-21 14:41:18 +05:30`
- **User Prompt**:
  > *"fill the sqlite db with 5 agents, 12 tickets already in the db"*
- **Intent**: Seed the embedded SQLite database with the 5 canonical support agents and 12 comprehensive, realistic customer concern tickets with discussion threads and balanced workloads.
- **Key Modules Affected**:
  - Backend: [`server/src/seed.js`](file:///Users/madhumita/ticketing-system/server/src/seed.js), [`server/src/db.js`](file:///Users/madhumita/ticketing-system/server/src/db.js)
  - Scripts: [`server/package.json`](file:///Users/madhumita/ticketing-system/server/package.json), [`package.json`](file:///Users/madhumita/ticketing-system/package.json)
  - Database: [`server/database.sqlite`](file:///Users/madhumita/ticketing-system/server/database.sqlite)
  - Documentation: [`KNOWLEDGE.md`](file:///Users/madhumita/ticketing-system/KNOWLEDGE.md), [`PROMPT_LOG.md`](file:///Users/madhumita/ticketing-system/PROMPT_LOG.md)
- **Actions Taken**:
  - **Created Standalone Seeder ([server/src/seed.js](file:///Users/madhumita/ticketing-system/server/src/seed.js))**:
    - Created `seedFullDatabase()` which sets up the 5 canonical agents (Sarah Chen, Alex Kumar, David Miller, Elena Rostova, Maya Lin) and 12 realistic tickets covering all categories (`Billing`, `Technical`, `Complaint`, `Product`, `General`), statuses (`open`, `in_progress`, `resolved`, `closed`), and priorities (`urgent`, `high`, `medium`, `low`).
    - Seeded realistic back-and-forth customer replies and agent support responses across 27 discussion comments.
    - Balanced workloads across all 5 agents (Sarah: 2 active, Elena: 2 active, Alex: 1 active, David: 1 active, Maya: 1 active).
  - **Added `npm run db:seed` Scripts**:
    - Added `"db:seed": "node src/seed.js"` to `server/package.json` and `"db:seed": "npm --prefix server run db:seed"` to root `package.json`.
    - Updated `server/src/db.js` so that `seedDatabase()` delegates to `seedFullDatabase()`.
  - **Execution & Verification**:
    - Executed `npm run db:seed`.
    - Verified database row counts (`PRAGMA integrity_check -> ok`, 5 agents, 12 tickets, 27 comments).
- **Status**: ✅ Completed successfully.

---

### Prompt #19: Remove Character Count Validation from Concern Subject & Description
- **Date & Time**: `2026-11-21 14:47:35 +05:30`
- **User Prompt**:
  > *"Describe Your Concern in Detail, Concern Subject - should not have the validation of character count - it just shouldnt be empty"*
- **Intent**: Remove minimum and maximum character length constraints from both "Concern Subject" and "Describe Your Concern in Detail", requiring only that they are non-empty.
- **Key Modules Affected**:
  - Frontend: [`client/src/components/UserWebsite.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/UserWebsite.jsx)
  - Backend: [`server/src/routes/tickets.js`](file:///Users/madhumita/ticketing-system/server/src/routes/tickets.js)
  - Documentation: [`KNOWLEDGE.md`](file:///Users/madhumita/ticketing-system/KNOWLEDGE.md), [`PROMPT_LOG.md`](file:///Users/madhumita/ticketing-system/PROMPT_LOG.md)
- **Actions Taken**:
  - **Frontend ([UserWebsite.jsx](file:///Users/madhumita/ticketing-system/client/src/components/UserWebsite.jsx))**:
    - Simplified `validateField('subject')` to verify only non-empty input (`!value || !value.trim()`), removing 5-character minimum and 150-character maximum limits.
    - Simplified `validateField('description')` to verify only non-empty input (`!value || !value.trim()`), removing 15-character minimum and 3000-character maximum limits.
    - Removed character counter badges (`{formData.subject.length}/150` and `{formData.description.length}/3000`).
    - Cleaned placeholders and removed `maxLength` properties so users can input any length subject and description without restriction.
  - **Backend ([server/src/routes/tickets.js](file:///Users/madhumita/ticketing-system/server/src/routes/tickets.js))**:
    - Updated `POST /api/tickets` to enforce only non-empty checks for `ticketTitle` and `ticketDesc`, removing the 5-150 and 15-3000 character boundaries.
  - **Verification**:
    - Verified Vite client compilation (`npm --prefix client run build`) with zero errors.
- **Status**: ✅ Completed successfully.

---

### Prompt #20: Fix Ticket Modal Collision with Navbar on dev-shivani
- **Date & Time**: `2026-11-21 14:52:29 +05:30`
- **User Prompt**:
  > *"opening the ticket in teh user screen makes it collide with the navbar"*
- **Intent**: Fix visual layering collision on the `dev-shivani` branch where opening a ticket's detail/conversation modal caused the sticky white navbar to float on top of and collide with the modal header.
- **Key Modules Affected**:
  - Frontend: [`client/src/index.css`](file:///Users/madhumita/ticketing-system/client/src/index.css)
  - Documentation: [`KNOWLEDGE.md`](file:///Users/madhumita/ticketing-system/KNOWLEDGE.md), [`PROMPT_LOG.md`](file:///Users/madhumita/ticketing-system/PROMPT_LOG.md)
- **Actions Taken**:
  - **Z-Index Layering Fix**:
    - Increased `.modal-overlay` to `z-index: 2000 !important;` (cleanly above `.website-navbar` at `z-index: 100`).
    - Configured backdrop with `background-color: rgba(15, 23, 42, 0.65);` and `backdrop-filter: blur(4px);`.
  - **Viewport Clearance & Scrolling Geometry**:
    - Set `.modal-overlay` padding to `2.5rem 1rem;` with `overflow-y: auto;`.
    - Set `.modal-content` and `.modal-large` to `max-height: calc(100vh - 5rem);` with `margin: auto;` and elevated drop shadow.
    - Set `.conversation-modal-body` to `max-height: calc(100vh - 16rem);` with internal scrolling.
    - Set `.modal-header` to `position: sticky; top: 0; background: white; z-index: 10; flex-shrink: 0;` ensuring headers and close controls never get pushed outside the visible screen.
  - **Restored Custom Dropdown Chevrons**:
    - Re-applied modern Lucide chevron-down vector styling (`appearance: none`) across `select`, `.filter-select`, `.form-group select`, `.agent-select-dropdown`, and `.card-agent-select`.
  - **Verification**:
    - Verified Vite client compilation (`npm --prefix client run build`) in 1.01s with zero errors.
- **Status**: ✅ Completed successfully.

---

### Prompt #22: Agent Online/Offline Visibility & Controls in Admin UI
- **Date & Time**: `2026-11-21 15:02:30 +05:30`
- **User Prompt**:
  > *"there is a funcionality of agent to go online offline. the admin should be able to see which agents are online/offline in the admin UI"*
- **Intent**: Provide complete visual visibility and control over agent online/offline availability throughout the Admin Dashboard.
- **Key Modules Affected**:
  - Frontend: [`client/src/components/AdminDashboard.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AdminDashboard.jsx), [`client/src/components/FilterBar.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/FilterBar.jsx), [`client/src/components/TicketModal.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/TicketModal.jsx), [`client/src/App.jsx`](file:///Users/madhumita/ticketing-system/client/src/App.jsx), [`client/src/index.css`](file:///Users/madhumita/ticketing-system/client/src/index.css)
  - Documentation: [`KNOWLEDGE.md`](file:///Users/madhumita/ticketing-system/KNOWLEDGE.md), [`PROMPT_LOG.md`](file:///Users/madhumita/ticketing-system/PROMPT_LOG.md)
- **Actions Taken**:
  - **Support Agents Roster Bar ([AdminDashboard.jsx](file:///Users/madhumita/ticketing-system/client/src/components/AdminDashboard.jsx))**:
    - Restored and enhanced the roster bar with live availability summary (`Support Agents (X Online / Y Total)`).
    - Added green/gray status indicator dots (`.status-indicator-dot.online`, `.status-indicator-dot.offline`) on each specialist's avatar.
    - Added clickable availability badges (`.badge-online` / `.badge-offline`) allowing the admin to inspect and toggle an agent's status directly via `PATCH /api/agents/:id/status`.
  - **Filter Bar ([FilterBar.jsx](file:///Users/madhumita/ticketing-system/client/src/components/FilterBar.jsx))**:
    - Appended `[Online]` and `[Offline]` tags to all agent dropdown options.
  - **Table View Inline Assignment ([AdminDashboard.jsx](file:///Users/madhumita/ticketing-system/client/src/components/AdminDashboard.jsx))**:
    - Appended `[Online]` and `[Offline]` tags to inline agent assignment options.
  - **Ticket Detail Modal ([TicketModal.jsx](file:///Users/madhumita/ticketing-system/client/src/components/TicketModal.jsx))**:
    - Appended `[Online]` and `[Offline]` tags to assignment dropdown options.
  - **Styling ([index.css](file:///Users/madhumita/ticketing-system/client/src/index.css))**:
    - Added CSS rules for `.status-indicator-dot`, `.agent-status-badge`, `.status-dot-mini`, and `.roster-pill-offline`.
  - **Verification**:
    - Verified Vite client compilation (`npm --prefix client run build`) in 967ms with zero errors.
- **Status**: ✅ Completed successfully.

---

### Prompt #23: Resolve Merge Conflicts & Complete Interactive Git Rebase on dev-shivani
- **Date & Time**: `2026-11-21 15:17:00 +05:30`
- **User Prompt**:
  > *"fix the merge conflicts and get out of rebase"*
- **Intent**: Resolve all unmerged file conflicts blocking the interactive git rebase on branch `dev-shivani` (onto `6853056`), complete the rebase cleanly, and verify build and database integrity.
- **Key Modules Affected**:
  - Frontend: [`client/src/components/AdminDashboard.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AdminDashboard.jsx), [`client/src/index.css`](file:///Users/madhumita/ticketing-system/client/src/index.css)
  - Database: [`server/database.sqlite-wal`](file:///Users/madhumita/ticketing-system/server/database.sqlite-wal)
  - Documentation: [`KNOWLEDGE.md`](file:///Users/madhumita/ticketing-system/KNOWLEDGE.md), [`PROMPT_LOG.md`](file:///Users/madhumita/ticketing-system/PROMPT_LOG.md)
- **Root Cause & Conflicts Resolved**:
  - Interactive rebase was picking commit `b706b42` ("show online/offline status") onto commit `6853056` ("seeded data").
  - In `client/src/components/AdminDashboard.jsx`: Conflicted between commented roster bar delimiter and new live support agent availability summary + toggle controls. Resolved by integrating live agent online/offline summary (`Support Agents (X Online / Y Total)`), avatar status indicators (`.status-indicator-dot`), interactive online/offline toggle badges (`.agent-status-badge`), and table view `[Online]`/`[Offline]` options.
  - In `client/src/index.css`: Conflicted on modal overlay z-index and dimensions. Resolved by maintaining `z-index: 2000 !important;` (preventing navbar collision) with `max-height: calc(100vh - 5rem);` and `conversation-modal-body` scroll limits.
  - In `server/database.sqlite-wal`: Binary conflict resolved using `--ours` to prevent SQLite WAL journal divergence.
- **Actions Taken**:
  - Resolved all conflict markers across [`client/src/components/AdminDashboard.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AdminDashboard.jsx) and [`client/src/index.css`](file:///Users/madhumita/ticketing-system/client/src/index.css).
  - Selected `--ours` on `server/database.sqlite-wal` and staged all resolved paths.
  - Executed `GIT_EDITOR=true git rebase --continue` to successfully complete the interactive rebase.
- **Verification & Outcome**:
  - Verified `git status`: Working tree clean on branch `dev-shivani`.
  - Verified Vite compilation (`npm --prefix client run build`) in 1.04s with zero errors.
  - Verified backend server (port 5001) and frontend dev server (port 5173) are actively running.
- **Status**: ✅ Completed successfully.

---

### Prompt #24: Resolve Merge Conflicts with origin/first_branch (SLA Integration)
- **Date & Time**: `2026-11-21 15:27:00 +05:30`
- **User Prompt**:
  > *"fix the merge conflicts without losing any functionality"*
- **Intent**: Resolve all unmerged file conflicts between `demo-prep` and `origin/first_branch` (`f05323a`, "sla added") without losing any existing functionality (agent availability, validation, modal layering, SLA due dates, list/card view modes).
- **Key Modules Affected**:
  - Frontend: [`client/src/components/UserWebsite.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/UserWebsite.jsx), [`client/src/components/AdminDashboard.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AdminDashboard.jsx), [`client/src/utils.js`](file:///Users/madhumita/ticketing-system/client/src/utils.js)
  - Backend: [`server/src/db.js`](file:///Users/madhumita/ticketing-system/server/src/db.js), [`server/src/routes/tickets.js`](file:///Users/madhumita/ticketing-system/server/src/routes/tickets.js), [`server/src/sla.js`](file:///Users/madhumita/ticketing-system/server/src/sla.js)
  - Documentation: [`KNOWLEDGE.md`](file:///Users/madhumita/ticketing-system/KNOWLEDGE.md), [`PROMPT_LOG.md`](file:///Users/madhumita/ticketing-system/PROMPT_LOG.md)
- **Actions Taken**:
  - **Database Migration & Seeding ([server/src/db.js](file:///Users/madhumita/ticketing-system/server/src/db.js))**:
    - Merged `calculateDueAt` SLA calculations alongside `seedFullDatabase` to compute and populate SLA due dates and urgent timestamps across all seeded and runtime tickets.
  - **User Portal View Modes & Navigation ([client/src/components/UserWebsite.jsx](file:///Users/madhumita/ticketing-system/client/src/components/UserWebsite.jsx))**:
    - Integrated View Mode Toggle (`List` vs `Cards`) for the in-page tracked tickets section.
    - Preserved top navbar "Track All My Tickets" button with smooth scroll navigation.
    - Retained custom Lucide `Layers` icon on Priority filter and visible `#{t.id}` ticket tags.
  - **Admin Dashboard & Styling**:
    - Confirmed preservation of Support Agents Roster Bar (`X Online / Y Total`), status indicator dots, and online/offline toggle badges alongside new SLA due date countdown badges.
- **Verification & Outcome**:
  - All 4 conflicted files resolved with zero conflict markers.
  - Verified Vite compilation (`npm --prefix client run build`) in 1.02s with zero errors.
- **Status**: ✅ Completed successfully.

---

### Prompt #25: Codebase Audit: CustomerPortal Component Usage Verification
- **Date & Time**: `2026-11-21 15:40:00 +05:30`
- **User Prompt**:
  > *"is CustomerPortal component being used?"*
- **Intent**: Audit the frontend codebase to determine if `CustomerPortal.jsx` is currently imported or used anywhere.
- **Key Modules Affected**:
  - Frontend: [`client/src/App.jsx`](file:///Users/madhumita/ticketing-system/client/src/App.jsx), [`client/src/components/CustomerPortal.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/CustomerPortal.jsx), [`client/src/components/UserWebsite.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/UserWebsite.jsx)
  - Documentation: [`PROMPT_LOG.md`](file:///Users/madhumita/ticketing-system/PROMPT_LOG.md)
- **Actions Taken**:
  - Grepped the entire repository and confirmed [`CustomerPortal.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/CustomerPortal.jsx) is not imported in [`App.jsx`](file:///Users/madhumita/ticketing-system/client/src/App.jsx) or any other component.
  - Verified that [`UserWebsite.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/UserWebsite.jsx) is the active component handling the customer/public experience on `/`.
- **Status**: ✅ Completed successfully.

---

### Prompt #26: Frontend Dead Code Audit: Unused Components Identification
- **Date & Time**: `2026-11-21 15:46:30 +05:30`
- **User Prompt**:
  > *"are there any files in frintend that are not being used?"*
- **Intent**: Comprehensive scan of all frontend directories (`client/src`, `client/src/components`, `client/public`) to detect unused files and dead code.
- **Key Modules Audited**:
  - Unused: [`client/src/components/CustomerPortal.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/CustomerPortal.jsx), [`client/src/components/PortalNav.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/PortalNav.jsx)
  - Active: [`App.jsx`](file:///Users/madhumita/ticketing-system/client/src/App.jsx), [`main.jsx`](file:///Users/madhumita/ticketing-system/client/src/main.jsx), [`utils.js`](file:///Users/madhumita/ticketing-system/client/src/utils.js), [`index.css`](file:///Users/madhumita/ticketing-system/client/src/index.css), [`UserWebsite.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/UserWebsite.jsx), [`AdminDashboard.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AdminDashboard.jsx), [`AgentScreen.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AgentScreen.jsx), [`AuthGate.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AuthGate.jsx), [`Header.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/Header.jsx), [`StatCard.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/StatCard.jsx), [`FilterBar.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/FilterBar.jsx), [`TicketCard.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/TicketCard.jsx), [`TicketModal.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/TicketModal.jsx)
  - Documentation: [`PROMPT_LOG.md`](file:///Users/madhumita/ticketing-system/PROMPT_LOG.md)
- **Findings**:
  - Found exactly 2 unused files: `CustomerPortal.jsx` and `PortalNav.jsx`. Both originate from the initial multi-tab prototype prior to path-based routing and `UserWebsite.jsx`.
- **Status**: ✅ Completed successfully.

---

### Prompt #27: Architecture Inquiry: Status Change Lifecycle Comment Mechanism
- **Date & Time**: `2026-11-21 16:12:00 +05:30`
- **User Prompt**:
  > *"the status of the ticket changed - how is a comment added for it?"*
- **Intent**: Explain the end-to-end mechanism of how an audit comment is generated and stored in SQLite when a ticket's status changes.
- **Key Modules Explained**:
  - Backend Endpoint: [`server/src/routes/tickets.js`](file:///Users/madhumita/ticketing-system/server/src/routes/tickets.js) (`PATCH /api/tickets/:id`)
  - Database Table: `comments` in [`server/database.sqlite`](file:///Users/madhumita/ticketing-system/server/database.sqlite)
  - Frontend Triggers: [`App.jsx`](file:///Users/madhumita/ticketing-system/client/src/App.jsx) (`handleStatusChange`), [`AgentScreen.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/AgentScreen.jsx) (`handleUpdateStatus`), [`TicketModal.jsx`](file:///Users/madhumita/ticketing-system/client/src/components/TicketModal.jsx)
  - Documentation: [`KNOWLEDGE.md`](file:///Users/madhumita/ticketing-system/KNOWLEDGE.md), [`PROMPT_LOG.md`](file:///Users/madhumita/ticketing-system/PROMPT_LOG.md)
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
