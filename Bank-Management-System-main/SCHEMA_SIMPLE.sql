-- ============================================================
-- SIMPLE SCHEMA - Copy and paste this directly into Supabase SQL Editor
-- ============================================================

-- 1. Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone TEXT DEFAULT '',
    role TEXT NOT NULL DEFAULT 'USER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Accounts table
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    account_number TEXT NOT NULL UNIQUE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    account_type TEXT NOT NULL,
    balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3. Cards table
CREATE TABLE cards (
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

-- 4. Bills table
CREATE TABLE bills (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bill_type TEXT NOT NULL,
    provider TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING'
);

-- 5. Rewards table
CREATE TABLE rewards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 0
);

-- 6. Transactions table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    sender_account_id INTEGER NOT NULL REFERENCES accounts(id),
    receiver_account_id INTEGER NOT NULL REFERENCES accounts(id),
    amount NUMERIC(14, 2) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'SUCCESS',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Notifications table
CREATE TABLE notifications (
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

-- Performance Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_transactions_sender ON transactions(sender_account_id);
CREATE INDEX idx_transactions_receiver ON transactions(receiver_account_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
