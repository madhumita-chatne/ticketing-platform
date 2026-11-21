export function getTicketDueAt(ticket) {
  if (ticket?.due_at) return new Date(ticket.due_at);

  if (!ticket?.created_at) return null;
  const due = new Date(ticket.created_at);
  if (Number.isNaN(due.getTime())) return null;

  if (ticket.priority === 'urgent') {
    due.setHours(due.getHours() + 2);
    return due;
  }

  const workingDays = {
    high: 2,
    medium: 3,
    low: 5
  }[ticket.priority] || 3;

  let addedDays = 0;
  while (addedDays < workingDays) {
    due.setDate(due.getDate() + 1);
    if (due.getDay() !== 0 && due.getDay() !== 6) addedDays += 1;
  }
  return due;
}

export function formatTicketDueDate(ticket) {
  const due = getTicketDueAt(ticket);
  if (!due) return 'Due date unavailable';

  return due.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getUrgentOverdueLabel(ticket, now = new Date()) {
  if (
    ticket?.priority !== 'urgent'
    || ['resolved', 'closed'].includes(ticket.status)
    || (!ticket.agent_id && (!ticket.assignee || ticket.assignee === 'Unassigned'))
  ) {
    return null;
  }

  const due = getTicketDueAt(ticket);
  if (!due || due.getTime() >= now.getTime()) return null;

  const overdueMinutes = Math.max(1, Math.floor((now.getTime() - due.getTime()) / 60000));
  const hours = Math.floor(overdueMinutes / 60);
  const minutes = overdueMinutes % 60;

  if (hours > 0) {
    return `Overdue ${hours}h${minutes ? ` ${minutes}m` : ''}`;
  }
  return `Overdue ${minutes}m`;
}

export function getUrgentTimerLabel(ticket, now = new Date()) {
  if (
    ticket?.priority !== 'urgent'
    || ['resolved', 'closed'].includes(ticket.status)
    || (!ticket.agent_id && (!ticket.assignee || ticket.assignee === 'Unassigned'))
  ) {
    return null;
  }

  const due = getTicketDueAt(ticket);
  if (!due) return null;

  const differenceMinutes = Math.ceil((due.getTime() - now.getTime()) / 60000);
  if (differenceMinutes <= 0) {
    const overdueMinutes = Math.max(1, Math.abs(differenceMinutes));
    const hours = Math.floor(overdueMinutes / 60);
    const minutes = overdueMinutes % 60;
    return {
      type: 'overdue',
      text: hours > 0
        ? `Overdue ${hours}h${minutes ? ` ${minutes}m` : ''}`
        : `Overdue ${minutes}m`
    };
  }

  const hours = Math.floor(differenceMinutes / 60);
  const minutes = differenceMinutes % 60;
  return {
    type: 'countdown',
    text: hours > 0
      ? `Time left ${hours}h${minutes ? ` ${minutes}m` : ''}`
      : `Time left ${minutes}m`
  };
}
