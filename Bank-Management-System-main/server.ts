import express, { Request, Response, NextFunction } from "express";
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import {
  initializeEmailService,
  sendWelcomeEmail,
  sendTransferConfirmationEmail,
  sendBillPaymentConfirmationEmail,
  sendLowBalanceAlertEmail,
} from "./src/lib/emailService";
import { checkDatabaseConnection, db } from "./src/lib/db";

// Load environment variables
dotenv.config();

// Initialize email service
initializeEmailService();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "ChangeThisSecretKeyToAtLeast32CharactersLongForProduction";
const JWT_EXPIRATION = "24h";

app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});
app.use(express.json({ limit: "10mb" }));

const authAttempts = new Map<string, { count: number; resetAt: number }>();
const AUTH_RATE_LIMIT = 10;
const AUTH_RATE_WINDOW_MS = 15 * 60 * 1000;

function limitAuthAttempts(req: Request, res: Response, next: NextFunction) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const current = authAttempts.get(key);
  const attempt = current && current.resetAt > now
    ? current
    : { count: 0, resetAt: now + AUTH_RATE_WINDOW_MS };

  attempt.count += 1;
  authAttempts.set(key, attempt);

  if (attempt.count > AUTH_RATE_LIMIT) {
    res.status(429).json({ error: "Too many authentication attempts. Try again later." });
    return;
  }

  next();
}

// In-Memory Durable Store structured exactly per PDF Database Schema
interface UserEntity {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role: "USER" | "ADMIN";
  createdAt: string;
}

interface AccountEntity {
  id: number;
  accountNumber: string;
  userId: number;
  accountType: "SAVINGS" | "CURRENT";
  balance: number;
  active: boolean;
}

interface TransactionEntity {
  id: number;
  senderId: number;
  receiverId: number;
  senderAccountNumber: string;
  receiverAccountNumber: string;
  senderName: string;
  receiverName: string;
  amount: number;
  description: string;
  status: "SUCCESS" | "FAILED";
  createdAt: string;
}

interface CardEntity {
  id: number;
  userId: number;
  maskedNumber: string;
  cardType: "VISA" | "MASTERCARD" | "CREDIT" | "DEBIT";
  creditLimit: number;
  availableLimit: number;
  expiry: string;
  cardHolder: string;
  active: boolean;
}

interface BillEntity {
  id: number;
  userId: number;
  billType: string;
  provider: string;
  amount: number;
  dueDate: string;
  status: "PENDING" | "PAID" | "OVERDUE";
}

interface RewardEntity {
  id: number;
  userId: number;
  points: number;
}

interface FeedbackEntity {
  id: number;
  name: string;
  message: string;
  rating: number;
  role?: string;
  avatar?: string;
  createdAt: string;
}

interface NotificationEntity {
  id: number;
  userId: number;
  type: "LOW_BALANCE" | "TRANSFER" | "SECURITY" | "BILL_DUE" | "SYSTEM";
  title: string;
  message: string;
  severity: "info" | "warning" | "success" | "critical";
  read: boolean;
  actionTab?: "overview" | "accounts" | "transfer" | "transactions" | "cards" | "bills" | "rewards";
  actionLabel?: string;
  createdAt: string;
}

// Seed initial system data
let nextUserId = 1;
let nextAccountId = 1;
let nextTransactionId = 1;
let nextCardId = 1;
let nextBillId = 1;
let nextRewardId = 1;
let nextFeedbackId = 1;
let nextNotificationId = 1;

const users: Map<number, UserEntity> = new Map();
const accounts: Map<number, AccountEntity> = new Map();
const transactions: TransactionEntity[] = [];
const cards: Map<number, CardEntity> = new Map();
const bills: Map<number, BillEntity> = new Map();
const rewards: Map<number, RewardEntity> = new Map();
const feedbacks: FeedbackEntity[] = [];
const notifications: NotificationEntity[] = [];

function createNotification(
  userId: number,
  type: "LOW_BALANCE" | "TRANSFER" | "SECURITY" | "BILL_DUE" | "SYSTEM",
  title: string,
  message: string,
  severity: "info" | "warning" | "success" | "critical",
  actionTab?: "overview" | "accounts" | "transfer" | "transactions" | "cards" | "bills" | "rewards",
  actionLabel?: string
) {
  const notif: NotificationEntity = {
    id: nextNotificationId++,
    userId,
    type,
    title,
    message,
    severity,
    read: false,
    actionTab,
    actionLabel,
    createdAt: new Date().toISOString(),
  };
  notifications.unshift(notif);
  return notif;
}

// Helper to seed initial sample accounts and data
function seedInitialData() {
  const salt = bcrypt.genSaltSync(10);
  const demoPasswordHash = bcrypt.hashSync("password123", salt);

  // Default User 1: Kartik (matching PDF docs)
  const user1: UserEntity = {
    id: nextUserId++,
    name: "Kartik Uparkar",
    email: "kartik@example.com",
    passwordHash: demoPasswordHash,
    phone: "9876543210",
    role: "USER",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  };
  users.set(user1.id, user1);

  const acc1: AccountEntity = {
    id: nextAccountId++,
    accountNumber: "AC0000000001",
    userId: user1.id,
    accountType: "SAVINGS",
    balance: 14850.50,
    active: true,
  };
  accounts.set(acc1.id, acc1);

  const acc1Current: AccountEntity = {
    id: nextAccountId++,
    accountNumber: "AC0000000002",
    userId: user1.id,
    accountType: "CURRENT",
    balance: 5200.00,
    active: true,
  };
  accounts.set(acc1Current.id, acc1Current);

  rewards.set(user1.id, {
    id: nextRewardId++,
    userId: user1.id,
    points: 1250,
  });

  cards.set(nextCardId, {
    id: nextCardId++,
    userId: user1.id,
    maskedNumber: "**** **** **** 1234",
    cardType: "VISA",
    creditLimit: 50000.00,
    availableLimit: 42350.00,
    expiry: "08/28",
    cardHolder: "KARTIK UPARKAR",
    active: true,
  });

  cards.set(nextCardId, {
    id: nextCardId++,
    userId: user1.id,
    maskedNumber: "**** **** **** 5678",
    cardType: "MASTERCARD",
    creditLimit: 25000.00,
    availableLimit: 21800.00,
    expiry: "11/29",
    cardHolder: "KARTIK UPARKAR",
    active: true,
  });

  bills.set(nextBillId, {
    id: nextBillId++,
    userId: user1.id,
    billType: "Electricity",
    provider: "State Electric Board",
    amount: 1200.00,
    dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
    status: "PENDING",
  });

  bills.set(nextBillId, {
    id: nextBillId++,
    userId: user1.id,
    billType: "Broadband Internet",
    provider: "FiberNet Gigabit",
    amount: 850.00,
    dueDate: new Date(Date.now() + 12 * 24 * 3600 * 1000).toISOString().split('T')[0],
    status: "PENDING",
  });

  bills.set(nextBillId, {
    id: nextBillId++,
    userId: user1.id,
    billType: "Cloud Hosting",
    provider: "AWS Cloud Infrastructure",
    amount: 210.00,
    dueDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
    status: "PAID",
  });

  // Default User 2: Global Merchant Partner
  const user2: UserEntity = {
    id: nextUserId++,
    name: "HooBank Global Reserves",
    email: "reserves@hoobank.com",
    passwordHash: demoPasswordHash,
    phone: "18005550199",
    role: "ADMIN",
    createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
  };
  users.set(user2.id, user2);

  const acc2: AccountEntity = {
    id: nextAccountId++,
    accountNumber: "AC0000000099",
    userId: user2.id,
    accountType: "CURRENT",
    balance: 230000000.00,
    active: true,
  };
  accounts.set(acc2.id, acc2);

  // Seed sample transactions matching UI design & PDF
  transactions.push({
    id: nextTransactionId++,
    senderId: acc2.id,
    receiverId: acc1.id,
    senderAccountNumber: "AC0000000099",
    receiverAccountNumber: "AC0000000001",
    senderName: "Manulife Cash Dividend",
    receiverName: "Kartik Uparkar",
    amount: 250.93,
    description: "Quarterly Investment Return",
    status: "SUCCESS",
    createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
  });

  transactions.push({
    id: nextTransactionId++,
    senderId: acc1.id,
    receiverId: acc2.id,
    senderAccountNumber: "AC0000000001",
    receiverAccountNumber: "AC0000000099",
    senderName: "Kartik Uparkar",
    receiverName: "Netflix Subscription",
    amount: 250.93,
    description: "Monthly Premium Plan",
    status: "SUCCESS",
    createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
  });

  transactions.push({
    id: nextTransactionId++,
    senderId: acc1.id,
    receiverId: acc2.id,
    senderAccountNumber: "AC0000000001",
    receiverAccountNumber: "AC0000000099",
    senderName: "Kartik Uparkar",
    receiverName: "Dribbble Pro Design",
    amount: 250.93,
    description: "Annual Designer Suite",
    status: "SUCCESS",
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
  });

  transactions.push({
    id: nextTransactionId++,
    senderId: acc1.id,
    receiverId: acc2.id,
    senderAccountNumber: "AC0000000001",
    receiverAccountNumber: "AC0000000099",
    senderName: "Kartik Uparkar",
    receiverName: "Whole Foods Market",
    amount: 342.50,
    description: "Organic Groceries & Provisions",
    status: "SUCCESS",
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  });

  transactions.push({
    id: nextTransactionId++,
    senderId: acc1.id,
    receiverId: acc2.id,
    senderAccountNumber: "AC0000000001",
    receiverAccountNumber: "AC0000000099",
    senderName: "Kartik Uparkar",
    receiverName: "Apple Store Regent St",
    amount: 899.00,
    description: "Hardware Upgrade & Accessories",
    status: "SUCCESS",
    createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
  });

  transactions.push({
    id: nextTransactionId++,
    senderId: acc1.id,
    receiverId: acc2.id,
    senderAccountNumber: "AC0000000001",
    receiverAccountNumber: "AC0000000099",
    senderName: "Kartik Uparkar",
    receiverName: "Uber & Airport Transit",
    amount: 145.20,
    description: "Airport Commute & City Rides",
    status: "SUCCESS",
    createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
  });

  transactions.push({
    id: nextTransactionId++,
    senderId: acc1.id,
    receiverId: acc2.id,
    senderAccountNumber: "AC0000000001",
    receiverAccountNumber: "AC0000000099",
    senderName: "Kartik Uparkar",
    receiverName: "Gourmet Bistro & Cafe",
    amount: 184.75,
    description: "Client Lunch & Dining",
    status: "SUCCESS",
    createdAt: new Date(Date.now() - 11 * 24 * 3600 * 1000).toISOString(),
  });

  transactions.push({
    id: nextTransactionId++,
    senderId: acc1.id,
    receiverId: acc2.id,
    senderAccountNumber: "AC0000000001",
    receiverAccountNumber: "AC0000000099",
    senderName: "Kartik Uparkar",
    receiverName: "AWS Cloud Infrastructure",
    amount: 210.00,
    description: "Production Server Cluster",
    status: "SUCCESS",
    createdAt: new Date(Date.now() - 18 * 24 * 3600 * 1000).toISOString(),
  });

  transactions.push({
    id: nextTransactionId++,
    senderId: acc1.id,
    receiverId: acc2.id,
    senderAccountNumber: "AC0000000001",
    receiverAccountNumber: "AC0000000099",
    senderName: "Kartik Uparkar",
    receiverName: "State Electric Board",
    amount: 450.00,
    description: "Monthly Power Utility Settlement",
    status: "SUCCESS",
    createdAt: new Date(Date.now() - 22 * 24 * 3600 * 1000).toISOString(),
  });

  // Seed public testimonials / feedback from UI screenshots
  feedbacks.push({
    id: nextFeedbackId++,
    name: "Herman Jensen",
    message: "Money is only a tool. It will take you wherever you wish, but it will not replace you as the driver.",
    rating: 5,
    role: "Founder & Leader",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
  });

  feedbacks.push({
    id: nextFeedbackId++,
    name: "Steve Mark",
    message: "Money makes your life easier. If you're lucky to have it, you're lucky. HooBank makes managing it effortless.",
    rating: 5,
    role: "Founder & Leader",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    createdAt: new Date(Date.now() - 18 * 24 * 3600 * 1000).toISOString(),
  });

  feedbacks.push({
    id: nextFeedbackId++,
    name: "Kenn Gallagher",
    message: "It is usually people in the money business, finance, and international trade that are really rich. HooBank levels the playing field.",
    rating: 5,
    role: "Founder & Leader",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
  });

  // Seed sample notifications for User 1 (Kartik)
  createNotification(
    user1.id,
    "LOW_BALANCE",
    "Low Balance Alert: Current Account",
    "Your Current Account (AC0000000002) balance is $5,200.00, below the optimal operating threshold ($6,000.00).",
    "warning",
    "transfer",
    "Deposit Funds"
  );

  createNotification(
    user1.id,
    "TRANSFER",
    "Transfer Confirmed: $250.93 to Netflix",
    "Instant transfer of $250.93 was successfully processed with atomic settlement on the HooBank ledger.",
    "success",
    "transactions",
    "View Ledger"
  );

  createNotification(
    user1.id,
    "SECURITY",
    "Security Update: Multi-Factor & Token Guard",
    "New biometric session authentication active. Token rotation and TLS 1.3 protocol are operating normally.",
    "info",
    "overview",
    "Review Security"
  );

  createNotification(
    user1.id,
    "BILL_DUE",
    "Upcoming Due Date: State Electric Board",
    "Utility invoice of $1,200.00 is due in 7 days. Pay on time to earn 120 HooBank Reward points.",
    "warning",
    "bills",
    "Pay Now"
  );
}

seedInitialData();

// Authentication Middleware
interface AuthRequest extends Request {
  userId?: number;
  userEmail?: string;
}

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access denied. Bearer token missing." });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch {
    res.status(403).json({ error: "Invalid or expired token." });
  }
}

// ==========================================
// 5.1 Auth Endpoints (/api/auth)
// ==========================================

// Helper to check if database is available
const isDatabaseAvailable = () => {
  return process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('USER:PASSWORD@HOST');
};

// POST /api/auth/register [public]
app.post("/api/auth/register", limitAuthAttempts, async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email, and password are required." });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    if (isDatabaseAvailable()) {
      // Use database
      const existing = await db.query("SELECT id FROM users WHERE lower(email) = lower($1)", [email]);
      if (existing.rowCount) {
        res.status(409).json({ error: "A user with this email already exists." });
        return;
      }

      const client = await db.connect();
      let newUser: { id: number; name: string; email: string };
      let accountNumber: string;
      try {
        await client.query("BEGIN");
        const userResult = await client.query(
          `INSERT INTO users (name, email, password_hash, phone, role)
           VALUES ($1, $2, $3, $4, 'USER')
           RETURNING id, name, email`,
          [name, email, passwordHash, phone || ""]
        );
        newUser = userResult.rows[0];
        accountNumber = `AC${String(newUser.id).padStart(10, "0")}`;
        await client.query(
          `INSERT INTO accounts (account_number, user_id, account_type, balance, active)
           VALUES ($1, $2, 'SAVINGS', 5000.00, true)`,
          [accountNumber, newUser.id]
        );
        await client.query(
          `INSERT INTO rewards (user_id, points) VALUES ($1, 100)`,
          [newUser.id]
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }

      const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, {
        expiresIn: JWT_EXPIRATION,
      });

      sendWelcomeEmail(newUser.name, newUser.email, accountNumber).catch((err) =>
        console.error("Failed to send welcome email:", err)
      );

      res.status(201).json({
        token,
        userId: newUser.id,
        name: newUser.name,
        email: newUser.email,
      });
    } else {
      // Use in-memory storage
      const emailLower = email.toLowerCase();
      const existingUser = Array.from(users.values()).find(u => u.email.toLowerCase() === emailLower);
      if (existingUser) {
        res.status(409).json({ error: "A user with this email already exists." });
        return;
      }

      const newUser: UserEntity = {
        id: nextUserId++,
        name,
        email,
        passwordHash,
        phone: phone || "",
        role: "USER",
        createdAt: new Date().toISOString(),
      };
      users.set(newUser.id, newUser);

      const accountNumber = `AC${String(newUser.id).padStart(10, "0")}`;
      const newAccount: AccountEntity = {
        id: nextAccountId++,
        accountNumber,
        userId: newUser.id,
        accountType: "SAVINGS",
        balance: 5000.00,
        active: true,
      };
      accounts.set(newAccount.id, newAccount);

      rewards.set(newUser.id, {
        id: nextRewardId++,
        userId: newUser.id,
        points: 100,
      });

      const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, {
        expiresIn: JWT_EXPIRATION,
      });

      sendWelcomeEmail(newUser.name, newUser.email, accountNumber).catch((err) =>
        console.error("Failed to send welcome email:", err)
      );

      res.status(201).json({
        token,
        userId: newUser.id,
        name: newUser.name,
        email: newUser.email,
      });
    }
  } catch (err: unknown) {
    console.error("Registration failed:", err);
    res.status(500).json({ error: "Failed to register user." });
  }
});

// POST /api/auth/login [public]
app.post("/api/auth/login", limitAuthAttempts, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    if (isDatabaseAvailable()) {
      // Use database
      const userResult = await db.query(
        `SELECT id, name, email, password_hash AS "passwordHash"
         FROM users WHERE lower(email) = lower($1)`,
        [email]
      );
      const user = userResult.rows[0] as UserEntity | undefined;
      if (!user) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }

      const isValid = bcrypt.compareSync(password, user.passwordHash);
      if (!isValid) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }

      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: JWT_EXPIRATION,
      });

      res.json({
        token,
        userId: user.id,
        name: user.name,
        email: user.email,
      });
    } else {
      // Use in-memory storage
      const emailLower = email.toLowerCase();
      const user = Array.from(users.values()).find(u => u.email.toLowerCase() === emailLower);
      if (!user) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }

      const isValid = bcrypt.compareSync(password, user.passwordHash);
      if (!isValid) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }

      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: JWT_EXPIRATION,
      });

      res.json({
        token,
        userId: user.id,
        name: user.name,
        email: user.email,
      });
    }
  } catch (err: unknown) {
    console.error("Login failed:", err);
    res.status(500).json({ error: "Login failed." });
  }
});

// ==========================================
// 5.2 User & Banking Data Endpoints (/api, JWT required)
// ==========================================

// GET /api/users/profile [JWT]
app.get("/api/users/profile", authenticateToken, async (req: AuthRequest, res: Response) => {
  if (isDatabaseAvailable()) {
    const result = await db.query(
      `SELECT id, name, email, phone, role, created_at AS "createdAt"
       FROM users WHERE id = $1`,
      [req.userId]
    );
    const user = result.rows[0] as UserEntity | undefined;
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      createdAt: user.createdAt,
    });
  } else {
    const user = users.get(req.userId!);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      createdAt: user.createdAt,
    });
  }
});

// GET /api/accounts [JWT]
app.get("/api/accounts", authenticateToken, async (req: AuthRequest, res: Response) => {
  if (isDatabaseAvailable()) {
    const result = await db.query(
      `SELECT id, account_number AS "accountNumber", account_type AS "accountType",
              balance, active
       FROM accounts WHERE user_id = $1 ORDER BY id`,
      [req.userId]
    );
    const userAccounts = result.rows;
    res.json(
      userAccounts.map((a) => ({
        id: a.id,
        accountNumber: a.accountNumber,
        accountType: a.accountType,
        balance: Number(a.balance),
        active: a.active,
      }))
    );
  } else {
    const userAccounts = Array.from(accounts.values()).filter(a => a.userId === req.userId);
    res.json(
      userAccounts.map((a) => ({
        id: a.id,
        accountNumber: a.accountNumber,
        accountType: a.accountType,
        balance: a.balance,
        active: a.active,
      }))
    );
  }
});

// GET /api/cards [JWT]
app.get("/api/cards", authenticateToken, async (req: AuthRequest, res: Response) => {
  if (isDatabaseAvailable()) {
    const result = await db.query(
      `SELECT id, masked_number AS "maskedNumber", card_type AS "cardType",
              credit_limit AS "creditLimit", available_limit AS "availableLimit",
              expiry, card_holder AS "cardHolder", active
       FROM cards WHERE user_id = $1 ORDER BY id`,
      [req.userId]
    );
    res.json(result.rows.map((card) => ({
      ...card,
      creditLimit: Number(card.creditLimit),
      availableLimit: Number(card.availableLimit),
    })));
  } else {
    const userCards = Array.from(cards.values()).filter(c => c.userId === req.userId);
    res.json(userCards.map((card) => ({
      id: card.id,
      maskedNumber: card.maskedNumber,
      cardType: card.cardType,
      creditLimit: card.creditLimit,
      availableLimit: card.availableLimit,
      expiry: card.expiry,
      cardHolder: card.cardHolder,
      active: card.active,
    })));
  }
});

// GET /api/bills [JWT]
app.get("/api/bills", authenticateToken, async (req: AuthRequest, res: Response) => {
  if (isDatabaseAvailable()) {
    const result = await db.query(
      `SELECT id, bill_type AS "billType", provider, amount,
              due_date AS "dueDate", status
       FROM bills WHERE user_id = $1 ORDER BY due_date`,
      [req.userId]
    );
    res.json(result.rows.map((bill) => ({ ...bill, amount: Number(bill.amount) })));
  } else {
    const userBills = Array.from(bills.values()).filter(b => b.userId === req.userId);
    res.json(userBills.map((bill) => ({
      id: bill.id,
      billType: bill.billType,
      provider: bill.provider,
      amount: bill.amount,
      dueDate: bill.dueDate,
      status: bill.status,
    })));
  }
});

// GET /api/rewards [JWT]
app.get("/api/rewards", authenticateToken, async (req: AuthRequest, res: Response) => {
  if (isDatabaseAvailable()) {
    const result = await db.query(
      "SELECT id, points FROM rewards WHERE user_id = $1",
      [req.userId]
    );
    const userReward = result.rows[0] || { id: 0, points: 0 };
    res.json({
      id: userReward.id,
      points: userReward.points,
    });
  } else {
    const userReward = rewards.get(req.userId!) || { id: 0, userId: req.userId!, points: 0 };
    res.json({
      id: userReward.id,
      points: userReward.points,
    });
  }
});

// GET /api/transactions [JWT]
app.get("/api/transactions", authenticateToken, async (req: AuthRequest, res: Response) => {
  if (isDatabaseAvailable()) {
    const result = await db.query(
      `SELECT
         t.id,
         t.amount,
         t.description,
         t.status,
         t.created_at AS "createdAt",
         sender.id AS "senderId",
         sender.account_number AS "senderAccountNumber",
         sender_user.name AS "senderName",
         receiver.id AS "receiverId",
         receiver.account_number AS "receiverAccountNumber",
         COALESCE(receiver_user.name, 'Account ' || receiver.account_number) AS "receiverName",
         CASE WHEN sender.user_id = $1 THEN 'DEBIT' ELSE 'CREDIT' END AS type
       FROM transactions t
       JOIN accounts sender ON sender.id = t.sender_account_id
       LEFT JOIN users sender_user ON sender_user.id = sender.user_id
       JOIN accounts receiver ON receiver.id = t.receiver_account_id
       LEFT JOIN users receiver_user ON receiver_user.id = receiver.user_id
       WHERE sender.user_id = $1 OR receiver.user_id = $1
       ORDER BY t.created_at DESC`,
      [req.userId]
    );

    res.json(result.rows.map((t) => ({
      id: t.id,
      sender: { id: t.senderId, accountNumber: t.senderAccountNumber, name: t.senderName || "Sender" },
      receiver: { id: t.receiverId, accountNumber: t.receiverAccountNumber, name: t.receiverName },
      amount: Number(t.amount),
      description: t.description,
      status: t.status,
      createdAt: t.createdAt,
      type: t.type,
    })));
  } else {
    const userAccounts = Array.from(accounts.values())
      .filter(a => a.userId === req.userId)
      .map(a => a.id);
    
    const userTransactions = transactions.filter(t => 
      userAccounts.includes(t.senderId) || userAccounts.includes(t.receiverId)
    );

    res.json(userTransactions.map((t) => {
      const type = userAccounts.includes(t.senderId) ? 'DEBIT' : 'CREDIT';
      return {
        id: t.id,
        sender: { 
          id: t.senderId, 
          accountNumber: t.senderAccountNumber, 
          name: t.senderName 
        },
        receiver: { 
          id: t.receiverId, 
          accountNumber: t.receiverAccountNumber, 
          name: t.receiverName 
        },
        amount: t.amount,
        description: t.description,
        status: t.status,
        createdAt: t.createdAt,
        type: type,
      };
    }));
  }
});

// POST /api/transactions/transfer [JWT]
app.post("/api/transactions/transfer", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { senderAccountId, receiverAccountNumber, amount, description } = req.body;
    const numAmount = Number(amount);
    const normalizedReceiverAccount = String(receiverAccountNumber || "").trim().toUpperCase();

    if (
      !Number.isInteger(Number(senderAccountId)) ||
      !normalizedReceiverAccount ||
      !Number.isFinite(numAmount) ||
      numAmount <= 0
    ) {
      res.status(400).json({ error: "Invalid transfer parameters. Valid amount, sender, and receiver required." });
      return;
    }

    const client = await db.connect();
    let senderAcc: { id: number; accountNumber: string; accountType: string; balance: number };
    let receiverAcc: { id: number; accountNumber: string; userId: number | null; balance: number };
    let newTx: { id: number; createdAt: string };
    let senderUser: { name: string; email: string };
    let receiverName: string;

    try {
      await client.query("BEGIN");
      const senderResult = await client.query(
        `SELECT id, account_number AS "accountNumber", account_type AS "accountType", balance
         FROM accounts WHERE id = $1 AND user_id = $2 AND active = true FOR UPDATE`,
        [Number(senderAccountId), req.userId]
      );
      if (!senderResult.rowCount) {
        res.status(403).json({ error: "Sender account not found or does not belong to the current user." });
        await client.query("ROLLBACK");
        return;
      }
      senderAcc = { ...senderResult.rows[0], balance: Number(senderResult.rows[0].balance) };

      if (senderAcc.balance < numAmount) {
        res.status(400).json({ error: `Insufficient balance. Available: $${senderAcc.balance.toFixed(2)}` });
        await client.query("ROLLBACK");
        return;
      }

      const receiverResult = await client.query(
        `SELECT id, account_number AS "accountNumber", user_id AS "userId", balance
         FROM accounts WHERE upper(account_number) = $1 AND active = true FOR UPDATE`,
        [normalizedReceiverAccount]
      );
      if (receiverResult.rowCount) {
        receiverAcc = { ...receiverResult.rows[0], balance: Number(receiverResult.rows[0].balance) };
      } else {
        const createdReceiver = await client.query(
          `INSERT INTO accounts (account_number, user_id, account_type, balance, active)
           VALUES (upper($1), NULL, 'CURRENT', 0, true)
           RETURNING id, account_number AS "accountNumber", user_id AS "userId", balance`,
          [normalizedReceiverAccount]
        );
        receiverAcc = { ...createdReceiver.rows[0], balance: Number(createdReceiver.rows[0].balance) };
      }

      if (senderAcc.id === receiverAcc.id) {
        res.status(400).json({ error: "Sender and receiver accounts must be different." });
        await client.query("ROLLBACK");
        return;
      }

      const senderUpdate = await client.query(
        `UPDATE accounts SET balance = balance - $1 WHERE id = $2
         RETURNING balance`,
        [numAmount, senderAcc.id]
      );
      await client.query("UPDATE accounts SET balance = balance + $1 WHERE id = $2", [numAmount, receiverAcc.id]);
      const txResult = await client.query(
        `INSERT INTO transactions (sender_account_id, receiver_account_id, amount, description, status)
         VALUES ($1, $2, $3, $4, 'SUCCESS')
         RETURNING id, created_at AS "createdAt"`,
        [senderAcc.id, receiverAcc.id, numAmount, description || "Money Transfer"]
      );
      const rewardPoints = Math.max(1, Math.floor(numAmount / 10));
      await client.query(
        `INSERT INTO rewards (user_id, points) VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET points = rewards.points + EXCLUDED.points`,
        [req.userId, rewardPoints]
      );
      const senderUserResult = await client.query("SELECT name, email FROM users WHERE id = $1", [req.userId]);
      senderUser = senderUserResult.rows[0];
      const receiverUserResult = receiverAcc.userId
        ? await client.query("SELECT name FROM users WHERE id = $1", [receiverAcc.userId])
        : { rows: [] };
      receiverName = receiverUserResult.rows[0]?.name || `Account ${receiverAcc.accountNumber}`;
      newTx = txResult.rows[0];
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, severity, action_tab, action_label)
         VALUES ($1, 'TRANSFER', $2, $3, 'success', 'transactions', 'View Receipt')`,
        [req.userId, `Transfer Sent: $${numAmount.toFixed(2)} to ${receiverName}`, `Transfer #${newTx.id} completed successfully.`]
      );
      await client.query("COMMIT");
      senderAcc.balance = Number(senderUpdate.rows[0].balance);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    // Create Transfer Successful Notification
    createNotification(
      req.userId!,
      "TRANSFER",
      `Transfer Sent: $${numAmount.toFixed(2)} to ${receiverName}`,
      `Successfully transferred $${numAmount.toFixed(2)} from ${senderAcc.accountType} (${senderAcc.accountNumber}) with transaction ID #${newTx.id}.`,
      "success",
      "transactions",
      "View Receipt"
    );

    // Check if sender balance is now low (< $1,000)
    if (senderAcc.balance < 1000) {
      createNotification(
        req.userId!,
        "LOW_BALANCE",
        `Low Balance Warning: ${senderAcc.accountType} Account`,
        `Your ${senderAcc.accountType} account (${senderAcc.accountNumber}) balance dropped to $${senderAcc.balance.toFixed(2)}. Consider topping up.`,
        "warning",
        "transfer",
        "Deposit Funds"
      );

      // Send low balance alert email
      if (senderUser) {
        sendLowBalanceAlertEmail(
          senderUser.email,
          senderUser.name,
          senderAcc.accountNumber,
          senderAcc.balance,
          senderAcc.accountType
        ).catch((err) => console.error("Failed to send low balance email:", err));
      }
    }

    // Send transfer confirmation email (async, non-blocking)
    if (senderUser) {
      sendTransferConfirmationEmail(
        senderUser.email,
        senderUser.name,
        numAmount,
        receiverName,
        senderAcc.accountNumber,
        senderAcc.balance,
        newTx.id
      ).catch((err) => console.error("Failed to send transfer email:", err));
    }

    res.status(201).json({
      id: newTx.id,
      amount: numAmount,
      status: "SUCCESS",
      description: description || "Money Transfer",
      createdAt: newTx.createdAt,
      newBalance: senderAcc.balance,
    });
  } catch (err: unknown) {
    console.error("Transfer failed:", err);
    res.status(500).json({ error: "Transfer failed." });
  }
});

// POST /api/bills [JWT] - Create a new bill
app.post("/api/bills", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { billType, provider, amount, dueDate } = req.body;

    if (!billType || !provider || !amount || !dueDate) {
      res.status(400).json({ error: "Missing required fields: billType, provider, amount, dueDate" });
      return;
    }

    if (isDatabaseAvailable()) {
      const result = await db.query(
        `INSERT INTO bills (user_id, bill_type, provider, amount, due_date, status)
         VALUES ($1, $2, $3, $4, $5, 'PENDING')
         RETURNING id, bill_type AS "billType", provider, amount, due_date AS "dueDate", status`,
        [req.userId, billType, provider, Number(amount), dueDate]
      );
      const newBill = result.rows[0];
      res.status(201).json({
        id: newBill.id,
        billType: newBill.billType,
        provider: newBill.provider,
        amount: Number(newBill.amount),
        dueDate: newBill.dueDate,
        status: newBill.status,
      });
    } else {
      // Demo mode: add to in-memory bills
      const newBillId = Math.max(...Array.from(bills.values()).map(b => b.id), 0) + 1;
      const newBill: BillEntity = {
        id: newBillId,
        userId: req.userId!,
        billType,
        provider,
        amount: Number(amount),
        dueDate,
        status: "PENDING",
      };
      bills.set(newBillId, newBill);
      res.status(201).json({
        id: newBill.id,
        billType: newBill.billType,
        provider: newBill.provider,
        amount: newBill.amount,
        dueDate: newBill.dueDate,
        status: newBill.status,
      });
    }
  } catch (err) {
    console.error("Create bill failed:", err);
    res.status(500).json({ error: "Failed to create bill." });
  }
});

// POST /api/bills/pay [JWT]
app.post("/api/bills/pay", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { billId, amount, accountId } = req.body;
    const client = await db.connect();
    let payment: {
      id: number;
      billType: string;
      provider: string;
      amount: number;
      paidAmount: number;
      accountNumber: string;
      accountType: string;
      newBalance: number;
      billId: number;
    };
    let senderUser: { name: string; email: string };

    try {
      await client.query("BEGIN");
      const billResult = await client.query(
        `SELECT id, bill_type AS "billType", provider, amount, status
         FROM bills WHERE id = $1 AND user_id = $2 FOR UPDATE`,
        [Number(billId), req.userId]
      );
      if (!billResult.rowCount) {
        res.status(404).json({ error: "Bill not found." });
        await client.query("ROLLBACK");
        return;
      }
      const bill = billResult.rows[0];
      if (bill.status === "PAID") {
        res.status(400).json({ error: "This bill is already paid." });
        await client.query("ROLLBACK");
        return;
      }

      const payAmount = Number(amount || bill.amount);
      const accountResult = await client.query(
        `SELECT id, account_number AS "accountNumber", account_type AS "accountType", balance
         FROM accounts WHERE id = $1 AND user_id = $2 AND active = true FOR UPDATE`,
        [Number(accountId), req.userId]
      );
      if (!accountResult.rowCount) {
        res.status(400).json({ error: "Specified account not found for payment." });
        await client.query("ROLLBACK");
        return;
      }
      const account = accountResult.rows[0];
      const currentBalance = Number(account.balance);
      if (!Number.isFinite(payAmount) || payAmount <= 0 || currentBalance < payAmount) {
        res.status(400).json({ error: `Insufficient account balance. Available: $${currentBalance.toFixed(2)}` });
        await client.query("ROLLBACK");
        return;
      }

      const balanceResult = await client.query(
        "UPDATE accounts SET balance = balance - $1 WHERE id = $2 RETURNING balance",
        [payAmount, account.id]
      );
      await client.query("UPDATE bills SET status = 'PAID' WHERE id = $1", [bill.id]);
      await client.query(
        `INSERT INTO rewards (user_id, points) VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET points = rewards.points + EXCLUDED.points`,
        [req.userId, Math.max(5, Math.floor(payAmount / 5))]
      );

      const billAccountResult = await client.query(
        `INSERT INTO accounts (account_number, user_id, account_type, balance, active)
         VALUES ($1, NULL, 'CURRENT', 0, true)
         ON CONFLICT (account_number) DO UPDATE SET account_number = EXCLUDED.account_number
         RETURNING id, account_number AS "accountNumber"`,
        [`BILL-${bill.provider}`]
      );
      const billAccount = billAccountResult.rows[0];
      await client.query(
        `INSERT INTO transactions (sender_account_id, receiver_account_id, amount, description, status)
         VALUES ($1, $2, $3, $4, 'SUCCESS')`,
        [account.id, billAccount.id, payAmount, `Bill Payment - ${bill.provider}`]
      );

      const balance = Number(balanceResult.rows[0].balance);
      const userResult = await client.query("SELECT name, email FROM users WHERE id = $1", [req.userId]);
      senderUser = userResult.rows[0];
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, severity, action_tab, action_label)
         VALUES ($1, 'BILL_DUE', $2, $3, 'success', 'bills', 'View Invoices')`,
        [req.userId, `Bill Settled: ${bill.provider}`, `Successfully paid $${payAmount.toFixed(2)} for ${bill.billType}.`]
      );
      if (balance < 1000) {
        await client.query(
          `INSERT INTO notifications (user_id, type, title, message, severity, action_tab, action_label)
           VALUES ($1, 'LOW_BALANCE', $2, $3, 'warning', 'transfer', 'Top Up Account')`,
          [req.userId, `Low Balance Warning: ${account.accountType} Account`, `Your balance is now $${balance.toFixed(2)}.`]
        );
      }
      payment = {
        id: bill.id,
        billId: bill.id,
        billType: bill.billType,
        provider: bill.provider,
        amount: Number(bill.amount),
        paidAmount: payAmount,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        newBalance: balance,
      };
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    sendBillPaymentConfirmationEmail(
      senderUser.email,
      senderUser.name,
      payment.paidAmount,
      payment.provider,
      payment.billType,
      payment.accountNumber,
      payment.newBalance
    ).catch((err) => console.error("Failed to send bill payment email:", err));

    res.json({
      id: payment.id,
      billType: payment.billType,
      provider: payment.provider,
      amount: payment.amount,
      status: "PAID",
      newBalance: payment.newBalance,
    });
  } catch (err: unknown) {
    console.error("Bill payment failed:", err);
    res.status(500).json({ error: "Bill payment failed." });
  }
});

// ==========================================
// 5.2.1 Notification Endpoints (/api/notifications, JWT)
// ==========================================

// GET /api/notifications [JWT] - Get all notifications for current user
app.get("/api/notifications", authenticateToken, async (req: AuthRequest, res: Response) => {
  const result = await db.query(
    `SELECT id, user_id AS "userId", type, title, message, severity, read,
            action_tab AS "actionTab", action_label AS "actionLabel",
            created_at AS "createdAt"
     FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.userId]
  );
  res.json(result.rows);
});

// PATCH /api/notifications/:id/read [JWT] - Mark single notification as read
app.patch("/api/notifications/:id/read", authenticateToken, async (req: AuthRequest, res: Response) => {
  const result = await db.query(
    `UPDATE notifications SET read = true
     WHERE id = $1 AND user_id = $2
     RETURNING id, user_id AS "userId", type, title, message, severity, read,
               action_tab AS "actionTab", action_label AS "actionLabel",
               created_at AS "createdAt"`,
    [Number(req.params.id), req.userId]
  );
  if (!result.rowCount) {
    res.status(404).json({ error: "Notification not found." });
    return;
  }
  res.json({ success: true, notification: result.rows[0] });
});

// POST /api/notifications/read-all [JWT] - Mark all notifications as read
app.post("/api/notifications/read-all", authenticateToken, async (req: AuthRequest, res: Response) => {
  const result = await db.query(
    "UPDATE notifications SET read = true WHERE user_id = $1 AND read = false",
    [req.userId]
  );
  res.json({ success: true, updatedCount: result.rowCount || 0 });
});

// DELETE /api/notifications/:id [JWT] - Delete single notification
app.delete("/api/notifications/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  const result = await db.query(
    "DELETE FROM notifications WHERE id = $1 AND user_id = $2",
    [Number(req.params.id), req.userId]
  );
  if (!result.rowCount) {
    res.status(404).json({ error: "Notification not found." });
    return;
  }
  res.json({ success: true, message: "Notification deleted." });
});

// DELETE /api/notifications/clear [JWT] - Clear all notifications for user
app.delete("/api/notifications/clear", authenticateToken, async (req: AuthRequest, res: Response) => {
  const result = await db.query("DELETE FROM notifications WHERE user_id = $1", [req.userId]);
  res.json({ success: true, clearedCount: result.rowCount || 0 });
});

// POST /api/notifications/simulate [JWT] - Simulate a real-time banking notification
app.post("/api/notifications/simulate", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { type, title, message, severity, actionTab, actionLabel } = req.body;
  const result = await db.query(
    `INSERT INTO notifications
       (user_id, type, title, message, severity, action_tab, action_label)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, user_id AS "userId", type, title, message, severity, read,
               action_tab AS "actionTab", action_label AS "actionLabel",
               created_at AS "createdAt"`,
    [
      req.userId,
      type || "SYSTEM",
      title || "System Alert",
      message || "This is a simulated notification.",
      severity || "info",
      actionTab || null,
      actionLabel || null,
    ]
  );
  res.status(201).json(result.rows[0]);
});

// ==========================================
// 5.3 Feedback Endpoints (/api/feedback, public)
// ==========================================

// GET /api/feedback [public]
app.get("/api/feedback", (_req: Request, res: Response) => {
  res.json(feedbacks);
});

// POST /api/feedback [public]
app.post("/api/feedback", (req: Request, res: Response) => {
  const { name, message, rating, photo } = req.body;

  if (!name || !message) {
    res.status(400).json({ error: "Name and message are required." });
    return;
  }

  const newFeedback: FeedbackEntity = {
    id: nextFeedbackId++,
    name,
    message,
    rating: Number(rating) || 5,
    role: "Verified Member",
    avatar: photo || `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 500)}?w=150&auto=format&fit=crop&q=80`,
    createdAt: new Date().toISOString(),
  };

  feedbacks.unshift(newFeedback);
  res.status(201).json(newFeedback);
});

// ==========================================
// 5.4 Public Utility Endpoints (/api/public, public)
// ==========================================

// GET /api/public/health [public]
app.get("/api/public/health", (_req: Request, res: Response) => {
  res.json({
    status: "UP",
    service: "Banking Backend",
    timestamp: new Date().toISOString(),
  });
});

// GET /api/public/stats [public]
app.get("/api/public/stats", (_req: Request, res: Response) => {
  const totalUserCount = 3800 + users.size;
  res.json({
    uptime: "available",
    secure: true,
    currency: "USD",
    activeUsers: `${totalUserCount}+`,
    trustedCompanies: "230+",
    totalTransactionVolume: "$230M+",
  });
});

// ==========================================
// 5.5 Currency Exchange & International Rates API (/api/currency)
// ==========================================

// In-Memory FX cache with 5-minute TTL
interface FxCacheItem {
  timestamp: number;
  data: {
    base: string;
    date: string;
    timeLastUpdated: number;
    rates: Record<string, number>;
    source: string;
  };
}

const fxRatesCache = new Map<string, FxCacheItem>();
const FX_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Baseline Interbank Benchmark Rates (used as resilient fallback)
const BASELINE_USD_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.924,
  GBP: 0.789,
  JPY: 154.2,
  CAD: 1.365,
  AUD: 1.522,
  CHF: 0.898,
  INR: 83.45,
  SGD: 1.352,
  AED: 3.673,
  CNY: 7.245,
  BRL: 5.412,
  MXN: 18.15,
  NZD: 1.642,
  HKD: 7.812,
  SEK: 10.62,
  ZAR: 18.25,
  KRW: 1378.0,
  THB: 36.8,
  SAR: 3.75,
  TRY: 32.7,
  PLN: 3.98,
  NOK: 10.75,
  DKK: 6.89,
};

async function fetchLiveExchangeRates(baseCurrency: string = "USD"): Promise<{
  base: string;
  date: string;
  timeLastUpdated: number;
  rates: Record<string, number>;
  source: string;
}> {
  const base = baseCurrency.toUpperCase();
  const cached = fxRatesCache.get(base);

  if (cached && Date.now() - cached.timestamp < FX_CACHE_TTL_MS) {
    return cached.data;
  }

  // 1. Primary Live Feed: Open Exchange Rates API
  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
      headers: { "User-Agent": "HooBank-Realtime-FX-Calculator/2.0" },
      signal: AbortSignal.timeout(4000),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.rates && Object.keys(data.rates).length > 0) {
        const result = {
          base: data.base_code || base,
          date: new Date().toISOString().split("T")[0],
          timeLastUpdated: data.time_last_update_unix ? data.time_last_update_unix * 1000 : Date.now(),
          rates: data.rates,
          source: "OPEN_EXCHANGE_FEED_LIVE",
        };

        fxRatesCache.set(base, {
          timestamp: Date.now(),
          data: result,
        });

        return result;
      }
    }
  } catch (err) {
    console.warn(`Primary Live FX API query for ${base} failed, attempting secondary mirror...`, err);
  }

  // 2. Secondary Live Feed Mirror
  try {
    const response2 = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (response2.ok) {
      const data2 = await response2.json();
      if (data2 && data2.rates && Object.keys(data2.rates).length > 0) {
        const result = {
          base: data2.base || base,
          date: data2.date || new Date().toISOString().split("T")[0],
          timeLastUpdated: data2.time_last_updated ? data2.time_last_updated * 1000 : Date.now(),
          rates: data2.rates,
          source: "EXCHANGERATE_API_LIVE_MIRROR",
        };

        fxRatesCache.set(base, {
          timestamp: Date.now(),
          data: result,
        });

        return result;
      }
    }
  } catch (err2) {
    console.warn(`Secondary FX mirror failed for ${base}, falling back to benchmark matrix`, err2);
  }

  // 3. High-Precision Synthetic Cross-Rates from Benchmark
  let computedRates: Record<string, number> = { ...BASELINE_USD_RATES };
  if (base !== "USD") {
    const baseToUsd = BASELINE_USD_RATES[base] || 1.0;
    computedRates = {};
    for (const [curr, rate] of Object.entries(BASELINE_USD_RATES)) {
      computedRates[curr] = Number((rate / baseToUsd).toFixed(6));
    }
    computedRates[base] = 1.0;
  }

  const fallbackData = {
    base,
    date: new Date().toISOString().split("T")[0],
    timeLastUpdated: Date.now(),
    rates: computedRates,
    source: "HOOBANK_INTERBANK_BENCHMARK",
  };

  fxRatesCache.set(base, {
    timestamp: Date.now(),
    data: fallbackData,
  });

  return fallbackData;
}

// GET /api/currency/rates
app.get("/api/currency/rates", async (req: Request, res: Response) => {
  const base = ((req.query.base as string) || "USD").toUpperCase();
  try {
    const ratesData = await fetchLiveExchangeRates(base);
    res.json(ratesData);
  } catch (err: any) {
    console.error("Failed to retrieve exchange rates:", err);
    res.status(500).json({ error: "Failed to retrieve exchange rates" });
  }
});

// POST /api/currency/calculate-quote
app.post("/api/currency/calculate-quote", async (req: Request, res: Response) => {
  const { sourceAmount, sourceCurrency = "USD", targetCurrency = "EUR" } = req.body;
  const amount = Number(sourceAmount);

  if (isNaN(amount) || amount <= 0) {
    res.status(400).json({ error: "A valid positive numeric source amount is required." });
    return;
  }

  const sCurr = String(sourceCurrency).toUpperCase();
  const tCurr = String(targetCurrency).toUpperCase();

  try {
    const fxData = await fetchLiveExchangeRates(sCurr);
    const rawRate = Number(fxData.rates[tCurr] ?? 1.0);

    // Exact mid-market pure converted amount without fees (standard real-world currency calculator result)
    const pureConvertedAmount = Number((amount * rawRate).toFixed(rawRate > 50 ? 2 : 4));

    // HooBank Transparent Fee structure:
    // Flat 0.25% FX fee (minimum $0.50, capped at $15.00)
    // Traditional retail banks charge ~2.5% - 4.0% hidden markups + $25 wire fees
    const rawFee = Math.max(0.5, Math.min(15.0, amount * 0.0025));
    const hooBankFee = Number(rawFee.toFixed(2));
    const netConvertibleAmount = Number(Math.max(0, amount - hooBankFee).toFixed(2));
    const targetAmount = Number((netConvertibleAmount * rawRate).toFixed(rawRate > 50 ? 2 : 2));
    const inverseRate = rawRate > 0 ? Number((1 / rawRate).toFixed(6)) : 0;

    // Estimated traditional bank equivalent fee (3% spread + $20 wire fee)
    const traditionalBankFee = Number((amount * 0.03 + 20).toFixed(2));
    const userSavings = Number(Math.max(0, traditionalBankFee - hooBankFee).toFixed(2));

    // Determine optimal routing rail
    let routingMethod: "HOOBANK_GLOBAL_NET" | "SWIFT_EXPRESS" | "SEPA_INSTANT" = "HOOBANK_GLOBAL_NET";
    let deliverySpeed = "Instant (HooBank Rail)";
    let estimatedArrival = "Within minutes";

    if (["EUR", "GBP", "CHF"].includes(tCurr)) {
      routingMethod = "SEPA_INSTANT";
      deliverySpeed = "Guaranteed < 1 hour";
      estimatedArrival = "Same-day Settlement";
    } else if (["INR", "SGD", "AED", "CAD", "AUD"].includes(tCurr)) {
      routingMethod = "HOOBANK_GLOBAL_NET";
      deliverySpeed = "Real-time Interbank Corridor";
      estimatedArrival = "Instant transfer";
    } else {
      routingMethod = "SWIFT_EXPRESS";
      deliverySpeed = "SWIFT Express Direct";
      estimatedArrival = "Same Business Day";
    }

    const guaranteedUntil = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2-hour rate lock

    res.json({
      sourceAmount: amount,
      sourceCurrency: sCurr,
      targetAmount,
      pureConvertedAmount,
      netConvertibleAmount,
      targetCurrency: tCurr,
      exchangeRate: rawRate,
      inverseRate,
      hooBankFee,
      traditionalBankFee,
      userSavings,
      guaranteedUntil,
      deliverySpeed,
      estimatedArrival,
      routingMethod,
    });
  } catch (err: any) {
    console.error("Failed to generate international payment quote:", err);
    res.status(500).json({ error: "Failed to generate international payment quote" });
  }
});

// ==========================================
// Vite Middleware & Static Serving Setup
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV === "production" && (!process.env.DATABASE_URL || !process.env.JWT_SECRET)) {
    throw new Error("DATABASE_URL and JWT_SECRET must be configured in production.");
  }

  await checkDatabaseConnection();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`HooBank server running on port ${PORT}`);
  });
}

startServer();
