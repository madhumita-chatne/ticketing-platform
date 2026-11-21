CREATE TABLE Ticket (
    ticketId INTEGER PRIMARY KEY,
    subject TEXT NOT NULL,
    description TEXT,
    createdBy TEXT NOT NULL,
    assignedTo TEXT,
    createdOn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedOn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedBy TEXT
);
