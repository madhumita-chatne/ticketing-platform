import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbPath = process.env.DATABASE_FILE || path.join(__dirname, '../database.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function seedFullDatabase() {
  console.log('🌱 Seeding SQLite database with 5 agents and 12 realistic tickets...');

  // 1. Ensure tables exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      role TEXT DEFAULT 'Support Specialist',
      department TEXT DEFAULT 'Customer Support',
      avatar_color TEXT DEFAULT '#4f46e5',
      status TEXT CHECK(status IN ('online', 'offline')) DEFAULT 'online',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
      priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
      category TEXT DEFAULT 'General',
      assignee TEXT DEFAULT 'Unassigned',
      agent_id INTEGER,
      customer_name TEXT DEFAULT 'Customer',
      customer_email TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      author TEXT NOT NULL,
      author_role TEXT DEFAULT 'agent',
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );
  `);

  // Clear existing data cleanly
  db.exec(`
    DELETE FROM comments;
    DELETE FROM tickets;
    DELETE FROM agents;
    DELETE FROM sqlite_sequence WHERE name IN ('agents', 'tickets', 'comments');
  `);

  // 2. Insert 5 canonical agents
  const insertAgent = db.prepare(`
    INSERT INTO agents (id, name, email, role, department, avatar_color, status)
    VALUES (?, ?, ?, ?, ?, ?, 'online')
  `);

  const agents = [
    [1, 'Sarah Chen', 'sarah.chen@support.com', 'Technical Support Specialist', 'Technical Support', '#4f46e5'],
    [2, 'Alex Kumar', 'alex.kumar@support.com', 'Billing & Accounts Lead', 'Billing & Accounts', '#0284c7'],
    [3, 'David Miller', 'david.miller@support.com', 'Product Escalations Engineer', 'Product Issues', '#7c3aed'],
    [4, 'Elena Rostova', 'elena.rostova@support.com', 'Customer Success Manager', 'VIP & Escalations', '#059669'],
    [5, 'Maya Lin', 'maya.lin@support.com', 'General Support Specialist', 'General Inquiries', '#d97706']
  ];

  for (const a of agents) {
    insertAgent.run(...a);
  }
  console.log('✅ 5 Agents seeded successfully.');

  // 3. Insert 12 tickets
  const insertTicket = db.prepare(`
    INSERT INTO tickets (id, title, description, status, priority, category, assignee, agent_id, customer_name, customer_email, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))
  `);

  const insertComment = db.prepare(`
    INSERT INTO comments (ticket_id, author, author_role, content, created_at)
    VALUES (?, ?, ?, ?, datetime('now', ?))
  `);

  const tickets = [
    {
      id: 1,
      title: 'Duplicate subscription charges on November invoice',
      description: 'Our accounting team noticed that we were charged twice for the Enterprise Tier subscription on November 1st. Please reverse the duplicate charge and issue an updated credit note.',
      status: 'open',
      priority: 'urgent',
      category: 'Billing',
      assignee: 'Alex Kumar',
      agent_id: 2,
      customer_name: 'Emma Watson',
      customer_email: 'emma.watson@enterprise.io',
      offsetCreated: '-2 hours',
      offsetUpdated: '-1 hour',
      comments: [
        {
          author: 'Alex Kumar',
          role: 'agent',
          content: 'Hello Emma! I am Alex Kumar from Billing & Accounts. Your concern has been automatically assigned to me based on current agent workload balancing. I am reviewing your transaction history right now.',
          offset: '-1 hour'
        }
      ]
    },
    {
      id: 2,
      title: 'REST API returning 500 error on bulk metrics endpoint',
      description: 'Calls to /api/v2/analytics/metrics with date range greater than 30 days are failing with HTTP 500 Internal Server Error. This is blocking our daily ETL pipeline.',
      status: 'in_progress',
      priority: 'high',
      category: 'Technical',
      assignee: 'Sarah Chen',
      agent_id: 1,
      customer_name: 'Marcus Aurelius',
      customer_email: 'marcus@phoenixlabs.dev',
      offsetCreated: '-5 hours',
      offsetUpdated: '-2 hours',
      comments: [
        {
          author: 'Sarah Chen',
          role: 'agent',
          content: 'Hello Marcus! I am Sarah Chen from Technical Support. I am reviewing the query planner logs for the analytics metrics endpoint.',
          offset: '-4 hours'
        },
        {
          author: 'Marcus Aurelius',
          role: 'customer',
          content: 'Thanks Sarah! Here is a sample request ID that reproduced the timeout: req-9843-af78.',
          offset: '-3 hours'
        },
        {
          author: 'Sarah Chen',
          role: 'agent',
          content: 'Identified a memory threshold timeout on SQLite aggregation queries for >30d spans. Working on a pagination fix right now.',
          offset: '-2 hours'
        }
      ]
    },
    {
      id: 3,
      title: 'Enterprise SLA response time guarantee breach inquiry',
      description: 'We experienced an outage earlier this week that took 3 hours to resolve, exceeding our 1-hour Gold SLA guarantee. Requesting an RCA report and credit discussion.',
      status: 'open',
      priority: 'high',
      category: 'Complaint',
      assignee: 'Elena Rostova',
      agent_id: 4,
      customer_name: 'Sophia Martinez',
      customer_email: 'sophia.m@globalnet.org',
      offsetCreated: '-3 hours',
      offsetUpdated: '-2 hours',
      comments: [
        {
          author: 'Elena Rostova',
          role: 'agent',
          content: 'Dear Sophia, I am Elena Rostova from VIP & Escalations. I have personally escalated this to our Director of Engineering and will share the comprehensive incident RCA within 24 hours.',
          offset: '-2 hours'
        }
      ]
    },
    {
      id: 4,
      title: 'CSV customer export fails on records with special characters',
      description: 'When downloading the full customer list as CSV, names containing accents or non-Latin characters cause encoding corruption and truncated rows.',
      status: 'resolved',
      priority: 'medium',
      category: 'Product',
      assignee: 'David Miller',
      agent_id: 3,
      customer_name: "Liam O'Connor",
      customer_email: 'liam.oc@innovate.co',
      offsetCreated: '-1 day',
      offsetUpdated: '-3 hours',
      comments: [
        {
          author: 'David Miller',
          role: 'agent',
          content: 'Hello Liam, thank you for reporting. I am inspecting the UTF-8 BOM encoding configuration on our CSV export worker.',
          offset: '-20 hours'
        },
        {
          author: 'System',
          role: 'system',
          content: "Ticket status updated from 'in_progress' to 'resolved'.",
          offset: '-4 hours'
        },
        {
          author: 'David Miller',
          role: 'agent',
          content: 'A patch has been deployed to production. CSV files now properly encode UTF-8 characters across all platforms and spreadsheet apps.',
          offset: '-3 hours'
        }
      ]
    },
    {
      id: 5,
      title: 'Assistance with Okta SAML 2.0 Single Sign-On setup',
      description: 'We are migrating all corporate users to Okta SSO. We need your ACS URL, Entity ID, and guidance on attribute mapping for custom roles.',
      status: 'open',
      priority: 'medium',
      category: 'General',
      assignee: 'Maya Lin',
      agent_id: 5,
      customer_name: 'Amina Al-Mansoor',
      customer_email: 'amina@techsurge.ae',
      offsetCreated: '-4 hours',
      offsetUpdated: '-3 hours',
      comments: [
        {
          author: 'Maya Lin',
          role: 'agent',
          content: 'Hello Amina! I am Maya Lin from General Inquiries. I have prepared our Okta Integration Guide and metadata XML configuration to help your team complete SSO onboarding.',
          offset: '-3 hours'
        }
      ]
    },
    {
      id: 6,
      title: 'Critical payment gateway timeout during checkout flow',
      description: 'Multiple customers in the European region reported timeouts when attempting to pay via Stripe 3D-Secure authentication during checkout.',
      status: 'in_progress',
      priority: 'urgent',
      category: 'Technical',
      assignee: 'Sarah Chen',
      agent_id: 1,
      customer_name: 'Carlos Santana',
      customer_email: 'carlos@soundwave.io',
      offsetCreated: '-6 hours',
      offsetUpdated: '-1 hour',
      comments: [
        {
          author: 'Sarah Chen',
          role: 'agent',
          content: 'Hi Carlos, reviewing webhook logs from Stripe EU endpoints now. We noticed a DNS latency spike on the Frankfurt gateway.',
          offset: '-5 hours'
        },
        {
          author: 'Carlos Santana',
          role: 'customer',
          content: 'We have temporarily rerouted user traffic. Let us know as soon as the gateway stabilizes.',
          offset: '-4 hours'
        },
        {
          author: 'Sarah Chen',
          role: 'agent',
          content: 'Rerouting traffic through the secondary Amsterdam gateway has dropped latency back below 120ms. Monitoring error rates closely.',
          offset: '-1 hour'
        }
      ]
    },
    {
      id: 7,
      title: 'Update company legal name and GSTIN on tax invoices',
      description: 'Our company has legally rebranded from TechFlow Ltd to NexaCorp Inc. Please update our billing profile and re-issue invoices for Q3.',
      status: 'resolved',
      priority: 'medium',
      category: 'Billing',
      assignee: 'Alex Kumar',
      agent_id: 2,
      customer_name: 'Priya Sharma',
      customer_email: 'priya.sharma@fintechcloud.in',
      offsetCreated: '-2 days',
      offsetUpdated: '-6 hours',
      comments: [
        {
          author: 'Alex Kumar',
          role: 'agent',
          content: 'Hello Priya! Congratulations on the rebrand. Please provide the Certificate of Incorporation and updated tax registration number.',
          offset: '-1 day'
        },
        {
          author: 'Priya Sharma',
          role: 'customer',
          content: 'Attached the legal documentation and tax certificate for NexaCorp Inc.',
          offset: '-18 hours'
        },
        {
          author: 'Alex Kumar',
          role: 'agent',
          content: 'Verified! Profile has been updated and amended invoices for Q3 have been dispatched to your accounting email.',
          offset: '-6 hours'
        }
      ]
    },
    {
      id: 8,
      title: 'Mobile dashboard sidebar does not collapse on swipe',
      description: 'On iOS Safari, swiping left does not close the navigation sidebar after opening a ticket. Users have to tap outside the drawer to dismiss it.',
      status: 'open',
      priority: 'low',
      category: 'Product',
      assignee: 'David Miller',
      agent_id: 3,
      customer_name: 'Oliver Twist',
      customer_email: 'oliver.t@workplace.co.uk',
      offsetCreated: '-8 hours',
      offsetUpdated: '-6 hours',
      comments: [
        {
          author: 'David Miller',
          role: 'agent',
          content: "Hi Oliver, thanks for reporting this mobile UX edge case. I've logged ticket UI-402 with our frontend engineering team.",
          offset: '-6 hours'
        }
      ]
    },
    {
      id: 9,
      title: 'Requesting custom data retention policy compliance documentation',
      description: 'Our compliance auditors require documentation confirming our audit log retention schedules and GDPR data purge mechanisms.',
      status: 'closed',
      priority: 'low',
      category: 'General',
      assignee: 'Maya Lin',
      agent_id: 5,
      customer_name: 'Rachel Green',
      customer_email: 'rachel.green@centralperk.com',
      offsetCreated: '-3 days',
      offsetUpdated: '-1 day',
      comments: [
        {
          author: 'Maya Lin',
          role: 'agent',
          content: 'Hi Rachel, attached is our ISO/IEC 27001 Data Retention and Sanitization Whitepaper.',
          offset: '-2 days'
        },
        {
          author: 'Rachel Green',
          role: 'customer',
          content: 'This satisfies all auditor requirements. Thank you Maya!',
          offset: '-1 day'
        },
        {
          author: 'System',
          role: 'system',
          content: "Ticket status updated from 'resolved' to 'closed'.",
          offset: '-1 day'
        }
      ]
    },
    {
      id: 10,
      title: 'Unsatisfactory support response time on critical ticket #4',
      description: 'Our previous production incident took over 4 hours before an engineer responded. This caused significant downtime for our end users.',
      status: 'in_progress',
      priority: 'high',
      category: 'Complaint',
      assignee: 'Elena Rostova',
      agent_id: 4,
      customer_name: 'Daniel Craig',
      customer_email: 'daniel.c@securityfirm.net',
      offsetCreated: '-10 hours',
      offsetUpdated: '-4 hours',
      comments: [
        {
          author: 'Elena Rostova',
          role: 'agent',
          content: 'Dear Daniel, I sincerely apologize for the delay your team experienced. I am auditing the alert escalation chain from that incident to prevent any future recurrence.',
          offset: '-8 hours'
        },
        {
          author: 'Daniel Craig',
          role: 'customer',
          content: 'We appreciate the direct transparency and look forward to the corrective action report.',
          offset: '-5 hours'
        }
      ]
    },
    {
      id: 11,
      title: 'Webhook signature verification failing with SHA256 mismatch',
      description: 'Our backend fails to verify incoming webhook payloads using the secret key provided in the developer console. Signatures do not match the raw body.',
      status: 'resolved',
      priority: 'high',
      category: 'Technical',
      assignee: 'Sarah Chen',
      agent_id: 1,
      customer_name: 'James Chen',
      customer_email: 'jchen@acme-corp.com',
      offsetCreated: '-1 day',
      offsetUpdated: '-5 hours',
      comments: [
        {
          author: 'Sarah Chen',
          role: 'agent',
          content: 'Hi James, please ensure your Node/Express middleware preserves the raw binary body before JSON parsing when computing the HMAC SHA256 signature.',
          offset: '-18 hours'
        },
        {
          author: 'James Chen',
          role: 'customer',
          content: 'That resolved it completely! Using express.raw() before bodyParser fixed the signature verification.',
          offset: '-6 hours'
        },
        {
          author: 'System',
          role: 'system',
          content: "Ticket status updated from 'in_progress' to 'resolved'.",
          offset: '-5 hours'
        }
      ]
    },
    {
      id: 12,
      title: 'Annual enterprise contract renewal and seat expansion quote',
      description: 'We are approaching our renewal date next month and would like to expand our team license from 50 seats to 150 seats. Please provide a formal quote.',
      status: 'closed',
      priority: 'medium',
      category: 'Billing',
      assignee: 'Alex Kumar',
      agent_id: 2,
      customer_name: 'Zoe Saldana',
      customer_email: 'zoe.s@creativemedia.com',
      offsetCreated: '-4 days',
      offsetUpdated: '-2 days',
      comments: [
        {
          author: 'Alex Kumar',
          role: 'agent',
          content: 'Hi Zoe, delighted to assist with your team expansion. I have prepared a customized quote with volume discounting for 150 seats.',
          offset: '-3 days'
        },
        {
          author: 'Zoe Saldana',
          role: 'customer',
          content: 'Quote signed and purchase order submitted via our procurement system.',
          offset: '-2 days'
        },
        {
          author: 'Alex Kumar',
          role: 'agent',
          content: 'Order processed and new licenses provisioned. Thank you for your continued partnership with TicketFlow!',
          offset: '-2 days'
        }
      ]
    }
  ];

  const insertAll = db.transaction(() => {
    for (const t of tickets) {
      insertTicket.run(
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.category,
        t.assignee,
        t.agent_id,
        t.customer_name,
        t.customer_email,
        t.offsetCreated,
        t.offsetUpdated
      );

      for (const c of t.comments) {
        insertComment.run(t.id, c.author, c.role, c.content, c.offset);
      }
    }
  });

  insertAll();
  db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
  console.log(`✅ Successfully seeded 5 agents, 12 tickets, and discussion threads into SQLite.`);
}

// Run directly if invoked from CLI
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedFullDatabase();
  process.exit(0);
}
