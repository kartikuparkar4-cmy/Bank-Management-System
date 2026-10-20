# 📧 Email Integration Setup Guide

## Overview
HooBank now includes real-time email notifications using **Nodemailer** with Gmail integration. Users will receive professional emails for:

- ✅ **Welcome emails** upon registration
- 💸 **Transfer confirmations** with transaction details
- 💳 **Bill payment confirmations**
- ⚠️ **Low balance alerts**
- 🔒 **Security alerts** (can be extended)
- 📊 **Monthly statements** (can be extended)

---

## 🚀 Quick Setup (Gmail)

### Step 1: Enable Gmail App Passwords

Since Gmail requires 2-Factor Authentication for third-party app access, you need to generate an **App Password**.

#### Instructions:

1. **Go to your Google Account Security settings:**
   - Visit: https://myaccount.google.com/security

2. **Enable 2-Step Verification** (if not already enabled):
   - Scroll to "How you sign in to Google"
   - Click "2-Step Verification" and follow the setup

3. **Generate an App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Select "Other (Custom name)" and type: **HooBank**
   - Click **Generate**
   - **Copy the 16-character password** (remove spaces)

### Step 2: Configure Environment Variables

Open your `.env` file and update the email configuration:

```env
# Email Configuration
EMAIL_ENABLED=true
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password-here
EMAIL_FROM=HooBank <your-actual-email@gmail.com>
```

**Example:**
```env
EMAIL_ENABLED=true
EMAIL_USER=johndoe@gmail.com
EMAIL_PASSWORD=abcdwxyzabcdwxyz
EMAIL_FROM=HooBank <johndoe@gmail.com>
```

### Step 3: Restart the Server

Stop the current server and restart:

```bash
npm run dev
```

You should see:
```
✅ Email service initialized with: your-email@gmail.com
HooBank server running on port 3000
```

---

## 📨 Email Templates Included

### 1. **Welcome Email**
Sent when a new user registers with:
- Account number
- Initial balance ($5,000)
- Virtual card details
- Bonus reward points (100)

### 2. **Transfer Confirmation Email**
Sent after successful money transfers with:
- Transaction amount
- Recipient name
- Transaction ID
- Updated balance
- Low balance warning (if applicable)

### 3. **Bill Payment Confirmation**
Sent after paying bills with:
- Bill provider and type
- Amount paid
- Reward points earned
- Updated balance

### 4. **Low Balance Alert**
Sent when account balance drops below $1,000 with:
- Current balance
- Account type and number
- Recommendation to add funds

### 5. **Security Alert** (Available)
For suspicious activities or security events

### 6. **Monthly Statement** (Available)
Summary of account activity (can be triggered manually)

---

## 🧪 Testing Email Integration

### Test 1: Registration Email
1. Register a new user with a **real Gmail address**
2. Check your inbox for the welcome email
3. Verify account details are correct

### Test 2: Transfer Email
1. Log in to the dashboard
2. Make a transfer to another account
3. Check inbox for transfer confirmation
4. Verify transaction details

### Test 3: Bill Payment Email
1. Go to the Bills section
2. Pay a pending bill
3. Check inbox for payment confirmation

### Test 4: Low Balance Alert
1. Transfer money until your balance is below $1,000
2. Check inbox for low balance warning

---

## 🔧 Advanced Configuration

### Using a Different Email Provider

If you want to use a provider other than Gmail (e.g., Outlook, Yahoo, custom SMTP):

Edit `src/lib/emailService.ts`:

```typescript
transporter = nodemailer.createTransport({
  host: "smtp.example.com",     // SMTP host
  port: 587,                     // SMTP port (587 for TLS, 465 for SSL)
  secure: false,                 // true for 465, false for other ports
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});
```

**Common SMTP Configurations:**

#### Outlook/Hotmail:
```typescript
{
  service: "hotmail",
  auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD }
}
```

#### Yahoo:
```typescript
{
  service: "yahoo",
  auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD }
}
```

#### Custom SMTP:
```typescript
{
  host: "smtp.yourdomain.com",
  port: 587,
  secure: false,
  auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD }
}
```

---

## 🛠️ Troubleshooting

### Problem: Emails not sending

**Solution 1:** Check console logs for errors:
```
❌ Failed to send email to user@gmail.com: [Error details]
```

**Solution 2:** Verify environment variables:
```bash
# In your terminal
echo $EMAIL_USER
echo $EMAIL_PASSWORD
echo $EMAIL_ENABLED
```

**Solution 3:** Check Gmail security settings:
- Ensure 2-Step Verification is enabled
- Ensure App Password is correct (16 characters, no spaces)
- Check "Less secure app access" is OFF (use App Passwords instead)

### Problem: Emails go to spam

**Solution:**
- Use a verified domain email (not Gmail)
- Set up SPF, DKIM, and DMARC records for your domain
- Reduce email frequency
- Ask users to whitelist your email address

### Problem: Gmail rate limits

Gmail has sending limits:
- **Free Gmail accounts:** 500 emails/day
- **Google Workspace:** 2,000 emails/day

**Solution:** For production, use a transactional email service:
- SendGrid
- Mailgun
- Amazon SES
- Postmark

---

## 🎨 Customizing Email Templates

Email templates are in `src/lib/emailService.ts`. Each function returns HTML content.

### Example: Customize Welcome Email

```typescript
export async function sendWelcomeEmail(name: string, email: string, accountNumber: string): Promise<void> {
  const content = `
    <h2>Welcome to HooBank, ${name}! 🎉</h2>
    <p>Your custom welcome message here...</p>
    
    <!-- Add your custom HTML -->
  `;

  await sendEmail({
    to: email,
    subject: "Your Custom Subject",
    html: content,
  });
}
```

---

## 📊 Monitoring Email Delivery

### Console Logs
All email events are logged:
```
✅ Email sent to user@gmail.com: Welcome to HooBank
📧 Email would be sent to user@gmail.com: Transfer Confirmation
❌ Failed to send email to user@gmail.com: [Error]
```

### Production Monitoring
For production, integrate email tracking:
- Open rates
- Click rates
- Bounce rates
- Delivery status

Use services like SendGrid or Mailgun for detailed analytics.

---

## 🔐 Security Best Practices

1. **Never commit `.env` to Git** (already in `.gitignore`)
2. **Use App Passwords, not regular Gmail passwords**
3. **Rotate App Passwords periodically**
4. **Use environment-specific email accounts:**
   - Development: `dev-noreply@yourdomain.com`
   - Production: `noreply@yourdomain.com`
5. **Rate-limit email sending to prevent abuse**
6. **Validate email addresses before sending**

---

## 📚 Additional Resources

- [Nodemailer Documentation](https://nodemailer.com/)
- [Gmail App Passwords Guide](https://support.google.com/accounts/answer/185833)
- [Google Workspace SMTP Settings](https://support.google.com/a/answer/176600)
- [Email Best Practices](https://sendgrid.com/blog/email-best-practices/)

---

## 🎯 Next Steps

1. ✅ Set up your Gmail App Password
2. ✅ Configure `.env` with your credentials
3. ✅ Test registration email
4. ✅ Test transaction emails
5. 📈 Monitor delivery rates
6. 🎨 Customize email templates to match your brand

---

**Need Help?** Open an issue or contact support at: support@hoobank.com

---

**Happy Banking! 🏦**
