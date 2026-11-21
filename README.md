# 🎫 TicketFlow - Ticket Tracking System

A modern, full-stack boilerplate for a ticket tracking system built with **React** (Vite), **Node.js** (Express), and an embedded **SQLite** database.

---

## 💡 About SQLite: Do You Need to Install Anything?

**NO installation is needed for SQLite!** 

Unlike MySQL, PostgreSQL, or MongoDB, **SQLite is an embedded, serverless database engine**.
- In this project, the Node.js backend uses **`better-sqlite3`**, which embeds the entire SQLite database engine directly inside the Node.js application process.
- When you run the server, it automatically creates a `database.sqlite` file inside the `server/` folder and pre-seeds it with initial sample tickets.
- **You do NOT need to install any SQLite software, CLI, or database server on your machine.**

### 🌐 Prefer an Online / Cloud SQLite Database?
If you want an online SQLite database accessible from the cloud with zero local storage:
1. **[Turso (libSQL)](https://turso.tech/)**: Provides free cloud-hosted SQLite databases with instant URLs and tokens.
   - You can replace `better-sqlite3` with `@libsql/client`:
     ```js
     import { createClient } from "@libsql/client";
     export const db = createClient({
       url: process.env.TURSO_DATABASE_URL,
       authToken: process.env.TURSO_AUTH_TOKEN
     });
     ```
2. **[Cloudflare D1](https://developers.cloudflare.com/d1/)**: Serverless SQLite on Cloudflare's edge network.

---

## 📁 Project Structure

All files have been created directly in your current workspace directory (`/Users/madhumita/ticketing-system`):

```text
ticketing-system/
├── package.json              # Root package to run client & server concurrently
├── .gitignore                # Git ignore rules for node_modules, sqlite files, .env
├── README.md                 # Project documentation & setup instructions
│
├── server/                   # Backend (Node.js + Express + SQLite)
│   ├── package.json          # Express, better-sqlite3, cors, dotenv
│   ├── .env                  # Port & database configuration
│   ├── .env.example          # Sample environment variables
│   └── src/
│       ├── index.js          # Express entry point & middleware
│       ├── db.js             # SQLite init, schema tables & auto-seeding
│       └── routes/
│           └── tickets.js    # CRUD routes & statistics endpoints
│
└── client/                   # Frontend (React + Vite)
    ├── package.json          # React, Vite, Lucide icons
    ├── vite.config.js        # Vite config with /api proxy to backend
    ├── index.html            # Main HTML shell
    └── src/
        ├── index.css         # Modern styling & design system
        ├── main.jsx          # React DOM entry point
        ├── App.jsx           # Main Dashboard (Kanban + Table views)
        └── components/
            ├── Header.jsx    # Navbar & action buttons
            ├── StatCard.jsx  # Metric cards (Total, Open, In Progress, Resolved)
            ├── FilterBar.jsx # Search, Category/Priority/Status filters, View toggle
            ├── TicketCard.jsx# Ticket item card with badges and actions
            └── TicketModal.jsx# Create & Edit Ticket dialog form
```

---

## 🚀 Quick Start Guide

### Step 1: Install Dependencies

From the root `ticketing-system/` directory:

```bash
# Install all dependencies for both server and client at once:
npm run install:all
```

*(Or install individually: `cd server && npm install`, then `cd ../client && npm install`)*

---

### Step 2: Run the Development Servers

You can run both backend and frontend together with a single command from the root folder:

```bash
npm run dev
```

Or run them in separate terminal windows:

#### Terminal 1 (Backend - Node.js Server):
```bash
cd server
npm run dev
```
> Server runs on: **`http://localhost:5001`**  
> Creates and connects to: **`server/database.sqlite`**

#### Terminal 2 (Frontend - React Vite App):
```bash
cd client
npm run dev
```
> Frontend runs on: **`http://localhost:5173`**  
> Automatically proxies API requests to `http://localhost:5001/api`

---

## 📡 API Endpoints (Backend)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tickets` | List tickets (supports query params: `status`, `priority`, `category`, `search`) |
| `GET` | `/api/tickets/stats` | Aggregated counts for dashboard cards |
| `GET` | `/api/tickets/:id` | Get details of a single ticket with comments |
| `POST` | `/api/tickets` | Create a new ticket |
| `PATCH`| `/api/tickets/:id` | Update ticket status, priority, title, assignee, etc. |
| `DELETE`| `/api/tickets/:id` | Delete a ticket |
| `POST` | `/api/tickets/:id/comments` | Add a comment to a ticket |
| `GET` | `/api/health` | Health check endpoint |

---

## ✨ Features Included

1. **Kanban & Table Views**: Switch seamlessly between a visual Kanban board and a compact table view.
2. **Status & Priority Badges**: Visual indicators for `urgent`, `high`, `medium`, `low` and `open`, `in_progress`, `resolved`, `closed`.
3. **Filter & Search**: Real-time filtering by status, priority, category, or title/assignee search.
4. **Interactive Modal**: Create new tickets or update existing ones with title, category, priority, status, and assignee.
5. **Auto-seeding**: Generates 5 initial realistic sample tickets on first run so you can immediately see data.
6. **Zero External DB Setup**: `better-sqlite3` manages the SQLite file inside the application.
