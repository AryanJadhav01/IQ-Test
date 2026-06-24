import { Pool } from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const useSqlite = process.env.USE_SQLITE === 'true';

let pgPool: Pool | null = null;
let sqliteDb: sqlite3.Database | null = null;

if (useSqlite) {
  const dbPath = path.resolve(__dirname, '../../iq_assessment.db');
  console.log(`[Database] Using SQLite fallback database at: ${dbPath}`);
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('[Database] Failed to connect to SQLite:', err.message);
    } else {
      console.log('[Database] Connected to SQLite database successfully.');
    }
  });
} else {
  console.log('[Database] Connecting to PostgreSQL...');
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  pgPool.on('error', (err) => {
    console.error('[Database] PostgreSQL pool error:', err);
  });
}

// Uniform query result interface matching pg
export interface QueryResult {
  rows: any[];
  rowCount: number;
}

export const query = async (text: string, params: any[] = []): Promise<QueryResult> => {
  if (useSqlite && sqliteDb) {
    return new Promise((resolve, reject) => {
      // Convert $1, $2 parameters syntax to SQLite ?
      const sqliteText = text.replace(/\$\d+/g, '?');
      
      // Select appropriate execution method
      const isSelect = sqliteText.trim().toUpperCase().startsWith('SELECT');
      
      if (isSelect) {
        sqliteDb!.all(sqliteText, params, (err, rows) => {
          if (err) {
            console.error(`[Database SQL Error] Query: ${sqliteText} | Params: ${JSON.stringify(params)}`);
            return reject(err);
          }
          resolve({
            rows: rows || [],
            rowCount: rows ? rows.length : 0,
          });
        });
      } else {
        sqliteDb!.run(sqliteText, params, function (err) {
          if (err) {
            console.error(`[Database SQL Error] Run: ${sqliteText} | Params: ${JSON.stringify(params)}`);
            return reject(err);
          }
          resolve({
            rows: [],
            rowCount: this.changes || 0,
          });
        });
      }
    });
  } else if (pgPool) {
    const res = await pgPool.query(text, params);
    return {
      rows: res.rows,
      rowCount: res.rowCount !== null && res.rowCount !== undefined ? res.rowCount : res.rows.length,
    };
  } else {
    throw new Error('No active database connection found.');
  }
};

export const initDB = async (): Promise<void> => {
  const usersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      university TEXT,
      platform_role TEXT,
      phone TEXT,
      age INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Autoincrement differs between SQLite and PG. We use compatibility handling:
  const questionsTable = useSqlite
    ? `
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        category TEXT NOT NULL,
        explanation TEXT,
        image_url TEXT
      );
    `
    : `
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        category TEXT NOT NULL,
        explanation TEXT,
        image_url TEXT
      );
    `;

  const assessmentsTable = `
    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      status TEXT DEFAULT 'in_progress',
      current_question_index INTEGER DEFAULT 0,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP
    );
  `;

  const answersTable = `
    CREATE TABLE IF NOT EXISTS answers (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL,
      question_id INTEGER NOT NULL,
      selected_option TEXT,
      marked_for_review INTEGER DEFAULT 0,
      saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const resultsTable = `
    CREATE TABLE IF NOT EXISTS results (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      overall_iq INTEGER,
      category TEXT,
      percentile REAL,
      logical_score INTEGER,
      pattern_score INTEGER,
      numerical_score INTEGER,
      verbal_score INTEGER,
      analytical_score INTEGER,
      problem_solving_score INTEGER,
      ai_insights TEXT,
      careers TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const paymentsTable = `
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      assessment_id TEXT NOT NULL,
      razorpay_order_id TEXT NOT NULL,
      razorpay_payment_id TEXT,
      razorpay_signature TEXT,
      amount INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      plan_type TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const certificatesTable = `
    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      result_id TEXT NOT NULL,
      certificate_uuid TEXT UNIQUE NOT NULL,
      issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const couponsTable = `
    CREATE TABLE IF NOT EXISTS coupon_codes (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      discount_percent INTEGER NOT NULL,
      max_uses INTEGER NOT NULL,
      current_uses INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      expires_at TIMESTAMP
    );
  `;

  try {
    await query(usersTable);

    // Add university and platform_role fields if they don't exist
    try {
      if (useSqlite) {
        await query('ALTER TABLE users ADD COLUMN university TEXT');
      } else {
        await query('ALTER TABLE users ADD COLUMN university VARCHAR(255)');
      }
      console.log('[Database] Added university column to users table.');
    } catch (e) {
      // Ignore if column already exists
    }

    try {
      if (useSqlite) {
        await query('ALTER TABLE users ADD COLUMN platform_role TEXT');
      } else {
        await query('ALTER TABLE users ADD COLUMN platform_role VARCHAR(255)');
      }
      console.log('[Database] Added platform_role column to users table.');
    } catch (e) {
      // Ignore if column already exists
    }

    try {
      if (useSqlite) {
        await query('ALTER TABLE users ADD COLUMN phone TEXT');
      } else {
        await query('ALTER TABLE users ADD COLUMN phone VARCHAR(50)');
      }
      console.log('[Database] Added phone column to users table.');
    } catch (e) {
      // Ignore if column already exists
    }

    try {
      if (useSqlite) {
        await query('ALTER TABLE users ADD COLUMN age INTEGER');
      } else {
        await query('ALTER TABLE users ADD COLUMN age INT');
      }
      console.log('[Database] Added age column to users table.');
    } catch (e) {
      // Ignore if column already exists
    }

    await query(questionsTable);
    await query(assessmentsTable);
    await query(answersTable);
    await query(resultsTable);
    await query(paymentsTable);
    await query(certificatesTable);
    await query(couponsTable);
    console.log('[Database] Database tables initialized successfully.');
  } catch (error) {
    console.error('[Database] Error initializing database tables:', error);
    throw error;
  }
};
