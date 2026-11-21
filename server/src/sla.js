export function calculateDueAt(createdAt, priority) {
  const start = createdAt ? new Date(createdAt) : new Date();
  if (Number.isNaN(start.getTime())) {
    return new Date().toISOString();
  }

  if (priority === 'urgent') {
    return new Date(start.getTime() + 2 * 60 * 60 * 1000).toISOString();
  }

  const workingDays = {
    high: 2,
    medium: 3,
    low: 5
  }[priority] || 3;

  const due = new Date(start);
  let addedDays = 0;

  while (addedDays < workingDays) {
    due.setDate(due.getDate() + 1);
    const day = due.getDay();
    if (day !== 0 && day !== 6) {
      addedDays += 1;
    }
  }

  return due.toISOString();
}
