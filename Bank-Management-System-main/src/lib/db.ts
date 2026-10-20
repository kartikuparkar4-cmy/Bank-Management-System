import "dotenv/config";
import { Pool } from "pg";

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase.com') || process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
  // Connection pool settings optimized for Supabase
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function initializeDatabaseSchema(): Promise<void> {
  await db.query(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      phone TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'USER',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Accounts table
    CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      account_number TEXT NOT NULL UNIQUE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      account_type TEXT NOT NULL,
      balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE
    );

    -- Cards table
    CREATE TABLE IF NOT EXISTS cards (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      masked_number TEXT NOT NULL,
      card_type TEXT NOT NULL,
      credit_limit NUMERIC(14, 2) NOT NULL DEFAULT 0,
      available_limit NUMERIC(14, 2) NOT NULL DEFAULT 0,
      expiry TEXT NOT NULL,
      card_holder TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE
    );

    -- Bills table
    CREATE TABLE IF NOT EXISTS bills (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      bill_type TEXT NOT NULL,
      provider TEXT NOT NULL,
      amount NUMERIC(14, 2) NOT NULL,
      due_date DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING'
    );

    -- Rewards table
    CREATE TABLE IF NOT EXISTS rewards (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      points INTEGER NOT NULL DEFAULT 0
    );

    -- Transactions table
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      sender_account_id INTEGER NOT NULL REFERENCES accounts(id),
      receiver_account_id INTEGER NOT NULL REFERENCES accounts(id),
      amount NUMERIC(14, 2) NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'SUCCESS',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'info',
      read BOOLEAN NOT NULL DEFAULT FALSE,
      action_tab TEXT,
      action_label TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(sender_account_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_receiver ON transactions(receiver_account_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
  `);
}

export async function checkDatabaseConnection(): Promise<void> {
  // Skip database connection if DATABASE_URL is not properly configured
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('USER:PASSWORD@HOST')) {
    console.log("⚠️  Database connection skipped (no valid DATABASE_URL configured)");
    console.log("📝 Running in DEMO MODE with in-memory data");
    console.log("💡 To enable database: Set DATABASE_URL in .env file");
    return;
  }

  try {
    const client = await db.connect();
    try {
      await client.query("SELECT 1");
      await initializeDatabaseSchema();
      
      // Check if it's Supabase
      const isSupabase = process.env.DATABASE_URL.includes('supabase.com');
      if (isSupabase) {
        console.log("✅ Supabase PostgreSQL database connected successfully!");
      } else {
        console.log("✅ PostgreSQL database connected successfully!");
      }
      console.log("📊 Database tables initialized");
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    console.log("⚠️  Falling back to DEMO MODE with in-memory data");
    // Don't throw - allow app to continue in demo mode
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await db.end();
});

process.on('SIGINT', async () => {
  await db.end();
});
