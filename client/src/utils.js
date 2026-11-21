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
