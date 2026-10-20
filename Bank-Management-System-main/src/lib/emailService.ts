import nodemailer, { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

// Initialize email transporter
export function initializeEmailService() {
  // Read environment variables at runtime (not module load time)
  const EMAIL_ENABLED = process.env.EMAIL_ENABLED === "true";
  const EMAIL_USER = process.env.EMAIL_USER || "";
  const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || "";
  const EMAIL_FROM = process.env.EMAIL_FROM || "HooBank <noreply@hoobank.com>";
  
  console.log("🔍 EMAIL_ENABLED:", process.env.EMAIL_ENABLED, "→", EMAIL_ENABLED);
  console.log("🔍 EMAIL_USER:", EMAIL_USER);
  console.log("🔍 EMAIL_PASSWORD:", EMAIL_PASSWORD ? "***SET***" : "NOT SET");
  
  if (!EMAIL_ENABLED) {
    console.log("📧 Email service disabled (EMAIL_ENABLED=false or not set)");
    console.log("   To enable: Set EMAIL_ENABLED=true in .env file");
    return;
  }

  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    console.warn("⚠️  Email credentials missing. Email notifications will not be sent.");
    console.warn("   Set EMAIL_USER and EMAIL_PASSWORD in .env file");
    return;
  }

  try {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
    });

    console.log(`✅ Email service initialized with: ${EMAIL_USER}`);
  } catch (error) {
    console.error("❌ Failed to initialize email service:", error);
  }
}

// Email Templates
interface EmailData {
  to: string;
  subject: string;
  html: string;
}

function getEmailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 30px auto;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #00d4ff 0%, #0066ff 100%);
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          color: white;
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .content {
          padding: 40px 30px;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px 30px;
          text-align: center;
          font-size: 12px;
          color: #6c757d;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: linear-gradient(135deg, #00d4ff 0%, #0066ff 100%);
          color: white !important;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
        }
        .info-box {
          background: #f8f9fa;
          border-left: 4px solid #0066ff;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .amount {
          font-size: 24px;
          font-weight: 700;
          color: #0066ff;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏦 HooBank</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} HooBank. All rights reserved.</p>
          <p>This is an automated message. Please do not reply to this email.</p>
          <p style="margin-top: 10px;">
            <a href="http://localhost:3000" style="color: #0066ff; text-decoration: none;">Visit Dashboard</a> | 
            <a href="mailto:support@hoobank.com" style="color: #0066ff; text-decoration: none;">Contact Support</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send Email Function
async function sendEmail(data: EmailData): Promise<boolean> {
  const EMAIL_FROM = process.env.EMAIL_FROM || "HooBank <noreply@hoobank.com>";
  
  if (!transporter) {
    console.log(`📧 Email would be sent to ${data.to}: ${data.subject}`);
    return false;
  }

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: data.to,
      subject: data.subject,
      html: getEmailTemplate(data.html),
    });
    console.log(`✅ Email sent to ${data.to}: ${data.subject}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${data.to}:`, error);
    return false;
  }
}

// Email Templates for Different Events

export async function sendWelcomeEmail(name: string, email: string, accountNumber: string): Promise<void> {
  const content = `
    <h2>Welcome to HooBank, ${name}! 🎉</h2>
    <p>Thank you for joining HooBank. Your account has been successfully created.</p>
    
    <div class="info-box">
      <strong>Your Account Details:</strong><br>
      Account Number: <strong>${accountNumber}</strong><br>
      Email: ${email}<br>
      Initial Balance: <span class="amount">$5,000.00</span>
    </div>
    
    <p>You've received:</p>
    <ul>
      <li>✅ A Savings Account with $5,000 welcome balance</li>
      <li>✅ A Virtual Visa Card with $25,000 credit limit</li>
      <li>✅ 100 Bonus Reward Points</li>
      <li>✅ Premium security features (2FA, biometric auth)</li>
    </ul>
    
    <p style="text-align: center;">
      <a href="http://localhost:3000" class="button">Access Your Dashboard</a>
    </p>
    
    <p>If you have any questions, our support team is here to help 24/7.</p>
  `;

  await sendEmail({
    to: email,
    subject: "Welcome to HooBank - Your Account is Ready! 🎉",
    html: content,
  });
}

export async function sendTransferConfirmationEmail(
  email: string,
  name: string,
  amount: number,
  receiverName: string,
  accountNumber: string,
  newBalance: number,
  transactionId: number
): Promise<void> {
  const content = `
    <h2>Transfer Successful ✅</h2>
    <p>Hi ${name},</p>
    <p>Your money transfer has been successfully processed.</p>
    
    <div class="info-box">
      <strong>Transaction Details:</strong><br>
      Amount: <span class="amount">$${amount.toFixed(2)}</span><br>
      To: ${receiverName}<br>
      From Account: ${accountNumber}<br>
      Transaction ID: #${transactionId}<br>
      Date: ${new Date().toLocaleString()}<br>
      New Balance: <strong>$${newBalance.toFixed(2)}</strong>
    </div>
    
    ${newBalance < 1000 ? `
      <div class="info-box" style="border-left-color: #ff6b00;">
        ⚠️ <strong>Low Balance Alert:</strong> Your account balance is below $1,000. Consider adding funds.
      </div>
    ` : ""}
    
    <p style="text-align: center;">
      <a href="http://localhost:3000" class="button">View Transaction History</a>
    </p>
    
    <p><small>If you did not authorize this transaction, please contact us immediately.</small></p>
  `;

  await sendEmail({
    to: email,
    subject: `Transfer Confirmation - $${amount.toFixed(2)} sent to ${receiverName}`,
    html: content,
  });
}

export async function sendBillPaymentConfirmationEmail(
  email: string,
  name: string,
  amount: number,
  provider: string,
  billType: string,
  accountNumber: string,
  newBalance: number
): Promise<void> {
  const content = `
    <h2>Bill Payment Successful 💳</h2>
    <p>Hi ${name},</p>
    <p>Your bill payment has been processed successfully.</p>
    
    <div class="info-box">
      <strong>Payment Details:</strong><br>
      Provider: <strong>${provider}</strong><br>
      Bill Type: ${billType}<br>
      Amount Paid: <span class="amount">$${amount.toFixed(2)}</span><br>
      From Account: ${accountNumber}<br>
      Date: ${new Date().toLocaleString()}<br>
      New Balance: <strong>$${newBalance.toFixed(2)}</strong>
    </div>
    
    <p>✅ You've earned <strong>${Math.floor(amount / 5)} reward points</strong> for this payment!</p>
    
    ${newBalance < 1000 ? `
      <div class="info-box" style="border-left-color: #ff6b00;">
        ⚠️ <strong>Low Balance Alert:</strong> Your account balance is below $1,000.
      </div>
    ` : ""}
    
    <p style="text-align: center;">
      <a href="http://localhost:3000" class="button">View Bill History</a>
    </p>
  `;

  await sendEmail({
    to: email,
    subject: `Bill Payment Confirmation - ${provider} (${billType})`,
    html: content,
  });
}

export async function sendLowBalanceAlertEmail(
  email: string,
  name: string,
  accountNumber: string,
  balance: number,
  accountType: string
): Promise<void> {
  const content = `
    <h2>Low Balance Alert ⚠️</h2>
    <p>Hi ${name},</p>
    <p>Your account balance has dropped below the recommended threshold.</p>
    
    <div class="info-box" style="border-left-color: #ff6b00;">
      <strong>Account Details:</strong><br>
      Account: ${accountType} (${accountNumber})<br>
      Current Balance: <span class="amount" style="color: #ff6b00;">$${balance.toFixed(2)}</span><br>
      Recommended Minimum: $1,000.00
    </div>
    
    <p>To avoid potential transaction issues, we recommend adding funds to your account.</p>
    
    <p style="text-align: center;">
      <a href="http://localhost:3000" class="button">Add Funds Now</a>
    </p>
  `;

  await sendEmail({
    to: email,
    subject: `Low Balance Alert - ${accountType} Account`,
    html: content,
  });
}

export async function sendSecurityAlertEmail(
  email: string,
  name: string,
  alertType: string,
  message: string
): Promise<void> {
  const content = `
    <h2>Security Alert 🔒</h2>
    <p>Hi ${name},</p>
    <p>We detected important security activity on your account.</p>
    
    <div class="info-box" style="border-left-color: #dc3545;">
      <strong>Alert Type:</strong> ${alertType}<br>
      <strong>Message:</strong> ${message}<br>
      <strong>Time:</strong> ${new Date().toLocaleString()}<br>
      <strong>IP Address:</strong> [Auto-detected]
    </div>
    
    <p>If this was you, no action is needed. If you did not authorize this activity, please secure your account immediately.</p>
    
    <p style="text-align: center;">
      <a href="http://localhost:3000" class="button">Review Security Settings</a>
    </p>
    
    <p><small>For security concerns, contact us at: security@hoobank.com</small></p>
  `;

  await sendEmail({
    to: email,
    subject: `Security Alert - ${alertType}`,
    html: content,
  });
}

export async function sendMonthlyStatementEmail(
  email: string,
  name: string,
  month: string,
  totalTransactions: number,
  totalSpent: number,
  totalReceived: number,
  endingBalance: number
): Promise<void> {
  const content = `
    <h2>Monthly Account Statement 📊</h2>
    <p>Hi ${name},</p>
    <p>Here's your account summary for ${month}.</p>
    
    <div class="info-box">
      <strong>Account Activity Summary:</strong><br><br>
      Total Transactions: <strong>${totalTransactions}</strong><br>
      Total Spent: <span style="color: #dc3545; font-weight: 600;">-$${totalSpent.toFixed(2)}</span><br>
      Total Received: <span style="color: #28a745; font-weight: 600;">+$${totalReceived.toFixed(2)}</span><br>
      Ending Balance: <span class="amount">$${endingBalance.toFixed(2)}</span>
    </div>
    
    <p style="text-align: center;">
      <a href="http://localhost:3000" class="button">View Detailed Statement</a>
    </p>
    
    <p>Thank you for banking with HooBank!</p>
  `;

  await sendEmail({
    to: email,
    subject: `Monthly Statement - ${month}`,
    html: content,
  });
}
