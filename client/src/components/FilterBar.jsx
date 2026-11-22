import React from 'react';
import { Search, LayoutGrid, List } from 'lucide-react';

export default function FilterBar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  categoryFilter,
  setCategoryFilter,
  agentFilter,
  setAgentFilter,
  agents = [],
  viewMode,
  setViewMode
}) {
  return (
    <div className="filter-toolbar">
      <div className="search-box">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search by title, concern, customer or assignee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filter-group">
        {/* Filter by Agent */}
        <select
          className="filter-select"
          value={agentFilter || 'all'}
          onChange={(e) => setAgentFilter(e.target.value)}
          aria-label="Filter by Assigned Agent"
        >
          <option value="all">All Agents</option>
         
          {/* <option value="unassigned">Unassigned Only</option>  todo*/} 
        
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name} [{agent.status === 'offline' ? 'Offline' : 'Online'}] — {agent.department}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by Status"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        {/* <select
          className="filter-select"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          aria-label="Filter by Priority"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select> */}

        {/* <select
          className="filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by Category"
        >
          <option value="all">All Categories</option>
          <option value="Complaint">Complaint</option>
          <option value="General">General</option>
          <option value="Frontend">Frontend</option>
          <option value="Backend">Backend</option>
          <option value="Billing">Billing</option>
          <option value="Technical">Technical</option>
          <option value="DevOps">DevOps</option>
          <option value="Security">Security</option>
          <option value="Documentation">Documentation</option>
        </select> */}

        <div className="view-toggle">
          <button
            className={`view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
            onClick={() => setViewMode('kanban')}
            title="Kanban Board View"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List / Table View"
          >
            <List size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
