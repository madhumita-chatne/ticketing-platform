import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbPath = process.env.DATABASE_FILE || path.join(__dirname, '../database.sqlite');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

const clear = db.transaction(() => {
  db.prepare('DELETE FROM comments').run();
  db.prepare('DELETE FROM tickets').run();
  try {
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('tickets', 'comments')").run();
  } catch {
    // sqlite_sequence may not exist if autoincrement sequence table is empty
  }
});

clear();
db.exec('VACUUM');
console.log('✅ SQLite database cleared successfully (0 tickets, 0 comments).');
