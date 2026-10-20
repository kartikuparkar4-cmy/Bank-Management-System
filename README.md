HooBank
HooBank is a full-stack digital banking application built with React on the frontend and Express on the backend. It provides a modern banking dashboard experience with authentication, transaction flows, account management, bill payments, notifications, FX conversion, and email-based customer alerts.

Overview
The project combines:

a polished marketing and dashboard frontend in React + TypeScript
a secure Express API layer for user and banking operations
PostgreSQL persistence for user and account data
JWT-based authentication and protected routes
real-time email notifications through Nodemailer and Gmail
production-ready build scripts and deployment-friendly configuration
The app is designed as a demo banking platform that can be run locally, used for product presentations, or deployed to a hosting environment such as Render.

Product Highlights
User onboarding and login flows
Dashboard with account summaries and financial analytics
Cards, rewards, and bill payment management
Transaction history and money transfer workflow
Notification center with read, clear, and simulate actions
Public health and product stats endpoints
International currency exchange rate and quote calculations
Real-time email alerts for welcome, transfers, bills, and low balances
Tech Stack
React 19
TypeScript
Vite
Tailwind CSS
Express
PostgreSQL (pg)
JWT authentication
bcryptjs
Nodemailer
Recharts
lucide-react
Node.js 22
Application Architecture
Frontend
The frontend is structured around a landing page plus a dashboard experience from the React app entry point in src/App.tsx.

Key UI modules include:

Navbar
Hero
Stats
BusinessFeatures
BillingInvoicing
CardDeals
Testimonials
CurrencyExchangeSection
Partners
CTABanner
Footer
AuthModal
FeedbackModal
BankingDashboard
The frontend uses the API client in src/lib/api.ts, which automatically attaches the JWT token and routes requests through /api.

Backend
The server is implemented in server.ts and exposes the API under /api. It includes:

JWT middleware for protected routes
rate limiting for auth attempts
seeded in-memory and database-backed demo data
transaction validation logic
notification management
public endpoints and FX data services
email dispatch hooks for business actions
Data Layer
The project uses PostgreSQL through the connection pool in src/lib/db.ts and supports structured data for:

users
accounts
transactions
cards
bills
rewards
notifications
feedback
Project Structure
.
+-- src/
|   +-- components/
|   |   +-- AuthModal.tsx
|   |   +-- BankingDashboard.tsx
|   |   +-- BillingInvoicing.tsx
|   |   +-- BusinessFeatures.tsx
|   |   +-- CardDeals.tsx
|   |   +-- CTABanner.tsx
|   |   +-- CurrencyConverter.tsx
|   |   +-- CurrencyExchangeSection.tsx
|   |   +-- FeedbackModal.tsx
|   |   +-- Footer.tsx
|   |   +-- Hero.tsx
|   |   +-- HooBankLogo.tsx
|   |   +-- Navbar.tsx
|   |   +-- NotificationCenter.tsx
|   |   +-- Partners.tsx
|   |   +-- SpendingInsights.tsx
|   |   +-- Stats.tsx
|   |   +-- Testimonials.tsx
|   +-- lib/
|   |   +-- api.ts
|   |   +-- db.ts
|   |   +-- emailService.ts
|   +-- App.tsx
|   +-- index.css
|   +-- main.tsx
|   +-- types.ts
+-- public/
+-- scripts/
|   +-- smoke-test.ps1
+-- server.ts
+-- vite.config.ts
+-- package.json
+-- README.md
+-- EMAIL_SETUP_GUIDE.md
+-- QUICK_START_EMAIL.md
+-- EMAIL_FEATURES.md
+-- SETUP_CHECKLIST.md
+-- INTEGRATION_SUMMARY.md
+-- render.yaml
+-- dist/
Features in Detail
Authentication
The app supports:

user registration
user login
JWT session issuance
protected routes for financial and user data
rate limiting on auth requests
Demo credentials:

Email: kartik@example.com
Password: password123
Banking Features
account overview and balances
current and savings account support
transactions and transfers
bill payment workflow
rewards system
notifications and alerts
card data and limits
Feedback and Public Content
The project includes:

customer testimonials
feedback APIs for public submissions
health endpoint
public stats endpoint
Currency and Global Transfer
The backend supports live or fallback exchange rates with a quote engine for international payment calculations.

This includes:

base currency lookup via rates endpoint
quote generation based on source and target currency
fee transparency and route recommendation
guaranteed quote timing and estimated arrival metadata
Database Model
The application includes these core entities:

users
accounts
transactions
cards
bills
rewards
notifications
feedback
Example data model
User
- id
- name
- email
- passwordHash
- phone
- role
- createdAt

Account
- id
- accountNumber
- userId
- accountType
- balance
- active

Transaction
- id
- senderId
- receiverId
- senderAccountNumber
- receiverAccountNumber
- senderName
- receiverName
- amount
- description
- status
- createdAt

Bill
- id
- userId
- billType
- provider
- amount
- dueDate
- status

Reward
- id
- userId
- points

Notification
- id
- userId
- type
- title
- message
- severity
- read
- actionTab
- actionLabel
- createdAt
API Surface
Auth endpoints
Method	Route	Purpose
POST	/api/auth/register	Create a user and initial account
POST	/api/auth/login	Authenticate a user
User and account endpoints
Method	Route	Purpose
GET	/api/users/profile	Fetch current user profile
GET	/api/accounts	List user's accounts
GET	/api/cards	List user's cards
GET	/api/bills	List bills
GET	/api/rewards	Fetch reward balance
GET	/api/transactions	Fetch transaction history
POST	/api/transactions/transfer	Transfer funds between accounts
POST	/api/bills/pay	Pay an outstanding bill
Notifications and feedback
Method	Route	Purpose
GET	/api/notifications	Fetch notifications
PATCH	/api/notifications/:id/read	Mark one notification as read
POST	/api/notifications/read-all	Mark all notifications as read
DELETE	/api/notifications/:id	Delete a notification
DELETE	/api/notifications/clear	Clear all notifications
POST	/api/notifications/simulate	Create a simulated notification
GET	/api/feedback	Fetch public testimonials
POST	/api/feedback	Submit feedback
Public endpoints
Method	Route	Purpose
GET	/api/public/health	Health status
GET	/api/public/stats	Public service stats
GET	/api/currency/rates	Fetch FX rates
POST	/api/currency/calculate-quote	Generate a conversion quote
Authentication and Security
The backend includes:

JWT bearer authentication
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
x-powered-by disabled
basic auth rate limiting for login and registration attempts
secure password hashing using bcryptjs
Important configuration:

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=your-long-random-secret
Environment Variables
Create a .env file in the project root:

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=your-long-random-secret
Optional:

EMAIL_ENABLED=true
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM=HooBank <your-email@gmail.com>
GEMINI_API_KEY=your-gemini-api-key
APP_URL=https://your-deployed-url.example.com
PORT=3000
PORT is typically set automatically by the hosting platform. Locally, the app falls back to 3000.

Email Notification Setup
The app supports real-time email notifications using Gmail and Nodemailer.

Required Gmail configuration
Enable 2-Step Verification on your Google account
Generate an App Password at https://myaccount.google.com/apppasswords
Add these values to .env:
EMAIL_ENABLED=true
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=HooBank <your-email@gmail.com>
Email types supported
welcome emails on registration
transfer confirmation emails
bill payment confirmation emails
low-balance alerts
reusable security and statement templates for future expansion
Local Development
Install dependencies
npm install
Run in development
npm run dev
On Windows PowerShell:

npm.cmd run dev
Verify the app
Open the app in a browser:

http://localhost:3000
Check the health endpoint:

http://localhost:3000/api/public/health
Expected response:

{
  "status": "UP",
  "service": "Banking Backend"
}
Build and Production Scripts
npm run dev
npm run build
npm start
npm run lint
npm run verify
Script purposes
npm run dev: starts the Express + Vite development server
npm run build: compiles frontend assets and bundles backend into dist/server.cjs
npm start: runs the production bundle
npm run lint: runs TypeScript checks
npm run verify: performs lint + production build validation
Production Build Output
dist/index.html
dist/assets/
dist/server.cjs
Deployment
This project is designed for deployment as a Node web service with an external PostgreSQL database.

Render deployment example
Runtime: Node
Build Command: npm ci --include=dev && npm run build
Start Command: npm start
Health Check Path: /api/public/health
Recommended environment variables:

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=your-long-random-secret
EMAIL_ENABLED=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM=HooBank <your-email@gmail.com>
GEMINI_API_KEY=your-gemini-api-key
APP_URL=https://your-render-url.onrender.com
Smoke Test
A smoke-test script is included in scripts/smoke-test.ps1.

Use it against a running environment with:

$env:HOO_BANK_URL = "https://your-app-url"
$env:HOO_BANK_TEST_EMAIL = "test@example.com"
$env:HOO_BANK_TEST_PASSWORD = "your-password"
.\scripts\smoke-test.ps1
Never commit real credentials or environment secrets.

Behavioral Notes
The codebase includes seeded demo data and a sample account flow intended for product demonstrations. Some data is intentionally aligned with the banking UI and the generated banking scenario in the app.

Examples include:

seeded demo user kartik@example.com
demo transfer data
mock billing entries
reward points
low-balance notifications
public product stats
Security and Production Recommendations
keep DATABASE_URL and JWT_SECRET in the host provider’s secret environment
disable email until app-password configuration is confirmed
rotate any credentials previously committed to source control
do not use demo credentials in production
keep the app behind secure environment settings and proper database access controls
Verified Local Status
The following checks were verified in the project workflow:

dependencies installed successfully
local app responded on http://localhost:3000
health endpoint returned status: UP
TypeScript validation passed
production build completed successfully
API smoke checks covered auth and dashboard flows
protected endpoints returned seeded data after login
Summary
HooBank is a complete full-stack banking dashboard demo that demonstrates a realistic financial product experience, from landing page to secure API-backed account operations. The repository includes all necessary setup, deployment, and operational guidance to run the application locally and prepare it for deployment in a real environment.
