# ✅ HooBank Email Setup Checklist

## Pre-Setup Requirements

- [ ] Gmail account (required)
- [ ] 2-Step Verification enabled on Gmail
- [ ] HooBank application installed and running

---

## Step-by-Step Setup

### 1️⃣ Generate Gmail App Password

- [ ] Visit: https://myaccount.google.com/apppasswords
- [ ] Sign in to your Gmail account
- [ ] Create App Password:
  - App: **Mail**
  - Device: **HooBank**
- [ ] Copy the 16-character password
- [ ] Remove spaces from password

**Example Result:** `abcdefghijklmnop`

---

### 2️⃣ Configure Environment Variables

- [ ] Open `.env` file in project root
- [ ] Update these lines:

```env
EMAIL_ENABLED=true
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM=HooBank <your-email@gmail.com>
```

- [ ] Replace `your-email@gmail.com` with your Gmail
- [ ] Replace `abcdefghijklmnop` with your App Password
- [ ] Save the file

---

### 3️⃣ Restart Server

- [ ] Stop current server (Ctrl+C or Cmd+C)
- [ ] Run: `npm run dev`
- [ ] Verify console shows:
  ```
  ✅ Email service initialized with: your-email@gmail.com
  HooBank server running on port 3000
  ```

---

### 4️⃣ Test Email Functionality

#### Test 1: Welcome Email
- [ ] Open: http://localhost:3000
- [ ] Click "Get Started" or "Register"
- [ ] Fill form with **your real Gmail address**:
  - Name: Your Name
  - Email: **youremail@gmail.com** (NOT @example.com)
  - Password: Choose password
- [ ] Submit registration
- [ ] Check Gmail inbox for "Welcome to HooBank" email
- [ ] Check spam folder if not found

**Expected Email Subject:** `Welcome to HooBank - Your Account is Ready! 🎉`

#### Test 2: Transfer Confirmation
- [ ] Log in to dashboard
- [ ] Navigate to "Transfer" tab
- [ ] Fill transfer form:
  - From Account: Select your account
  - To Account: `AC0000000099` (demo account)
  - Amount: `50.00`
  - Description: `Test transfer`
- [ ] Submit transfer
- [ ] Check Gmail inbox for transfer confirmation

**Expected Email Subject:** `Transfer Confirmation - $50.00 sent to...`

#### Test 3: Bill Payment Confirmation
- [ ] Navigate to "Bills" tab
- [ ] Select a pending bill
- [ ] Click "Pay Now"
- [ ] Confirm payment
- [ ] Check Gmail inbox for payment confirmation

**Expected Email Subject:** `Bill Payment Confirmation - [Provider]`

#### Test 4: Low Balance Alert
- [ ] Transfer money until balance is below $1,000
- [ ] Check Gmail inbox for low balance warning

**Expected Email Subject:** `Low Balance Alert - [Account Type] Account`

---

## Verification Checklist

### Console Logs ✅

- [ ] Server starts without errors
- [ ] Email service initialization message shows
- [ ] Logs show: `✅ Email sent to...` after each action
- [ ] No error messages like `❌ Failed to send email`

### Emails Received ✅

- [ ] Welcome email received
- [ ] Transfer confirmation received
- [ ] Bill payment confirmation received
- [ ] Low balance alert received (if triggered)

### Email Quality ✅

- [ ] Emails look professional
- [ ] HooBank branding visible
- [ ] All details are accurate
- [ ] Links work correctly
- [ ] Mobile-responsive design
- [ ] No broken images or formatting

---

## Troubleshooting

### ❌ No emails received

**Check 1: Console Logs**
```bash
# Look for:
✅ Email sent to your@email.com

# If you see:
📧 Email service disabled
# Solution: Set EMAIL_ENABLED=true in .env

# If you see:
⚠️ Email credentials missing
# Solution: Set EMAIL_USER and EMAIL_PASSWORD in .env
```

**Check 2: Spam Folder**
- Look in Gmail spam/junk folder
- Mark as "Not Spam" if found

**Check 3: Gmail Settings**
- Verify 2-Step Verification is ON
- Verify App Password is correct (16 chars, no spaces)
- Try generating a new App Password

**Check 4: .env File**
- Ensure no extra spaces in values
- Ensure EMAIL_ENABLED=true (not false)
- Ensure file is saved after editing

**Check 5: Server Restart**
- Stop server completely (Ctrl+C)
- Start again: `npm run dev`
- Verify initialization message

---

### ❌ Emails go to spam

**Solutions:**
- [ ] Use a verified domain email (not Gmail for production)
- [ ] Set up SPF, DKIM, DMARC records
- [ ] Ask users to whitelist your email
- [ ] Reduce email sending frequency

---

### ❌ Authentication failed

**Error:** `Invalid login: 535-5.7.8 Username and Password not accepted`

**Solutions:**
1. Verify 2-Step Verification is enabled
2. Generate a **new** App Password
3. Use App Password, NOT your regular Gmail password
4. Ensure "Less secure app access" is OFF
5. Check for typos in EMAIL_USER and EMAIL_PASSWORD

---

## Quick Reference

### Files Modified/Created

| File | Purpose |
|------|---------|
| `.env` | Email credentials |
| `src/lib/emailService.ts` | Email service logic |
| `server.ts` | Email integration |
| `EMAIL_SETUP_GUIDE.md` | Complete guide |
| `QUICK_START_EMAIL.md` | Quick start |
| `EMAIL_FEATURES.md` | Feature docs |
| `INTEGRATION_SUMMARY.md` | Integration overview |

### Environment Variables

```env
EMAIL_ENABLED=true                        # Required
EMAIL_USER=your-email@gmail.com          # Required
EMAIL_PASSWORD=your-16-char-app-password # Required
EMAIL_FROM=HooBank <your-email@gmail.com> # Optional
```

### Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Check if server is running
curl http://localhost:3000/api/public/health

# View server logs
# Check terminal where npm run dev is running
```

---

## Success Indicators 🎉

When everything is working correctly, you should see:

### In Console:
```
✅ Email service initialized with: youremail@gmail.com
HooBank server running on port 3000
✅ Email sent to youremail@gmail.com: Welcome to HooBank
✅ Email sent to youremail@gmail.com: Transfer Confirmation
```

### In Gmail:
- Professional emails with HooBank branding
- Accurate transaction details
- Working links to dashboard
- Mobile-friendly design

### In Dashboard:
- All features work normally
- No delays when registering/transferring
- Notifications appear in UI
- Email confirmations arrive within seconds

---

## Next Steps After Setup

1. **Customize Email Templates** (Optional)
   - Edit `src/lib/emailService.ts`
   - Modify HTML content in email functions
   - Test changes thoroughly

2. **Production Deployment** (For live use)
   - Switch to SendGrid/Mailgun/AWS SES
   - Set up domain authentication
   - Configure rate limiting
   - See `EMAIL_SETUP_GUIDE.md` for details

3. **Monitor Email Delivery**
   - Check console logs regularly
   - Monitor bounce rates
   - Track user engagement

---

## Need Help?

📚 **Read the guides:**
- [EMAIL_SETUP_GUIDE.md](EMAIL_SETUP_GUIDE.md) - Complete setup
- [QUICK_START_EMAIL.md](QUICK_START_EMAIL.md) - Quick start
- [EMAIL_FEATURES.md](EMAIL_FEATURES.md) - Feature details
- [INTEGRATION_SUMMARY.md](INTEGRATION_SUMMARY.md) - Technical overview

🔗 **External resources:**
- [Gmail App Passwords](https://myaccount.google.com/apppasswords)
- [Nodemailer Docs](https://nodemailer.com/)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)

---

**Happy Banking! 🏦📧**

*Setup should take 5-10 minutes total*
