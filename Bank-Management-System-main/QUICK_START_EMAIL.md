# 📧 Quick Start: Email Notifications

## 5-Minute Setup

### Step 1: Get Gmail App Password (2 minutes)

1. Visit: **https://myaccount.google.com/apppasswords**
2. Sign in to your Gmail account
3. Create new app password:
   - App: **Mail**
   - Device: **HooBank** (or any name)
4. **Copy the 16-character password** (example: `abcd efgh ijkl mnop`)
5. Remove spaces: `abcdefghijklmnop`

### Step 2: Configure `.env` (1 minute)

Open `.env` file and replace these lines:

```env
EMAIL_ENABLED=true
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM=HooBank <youremail@gmail.com>
```

**Replace:**
- `youremail@gmail.com` → Your actual Gmail address
- `abcdefghijklmnop` → Your 16-char app password

### Step 3: Restart Server (1 minute)

Stop the current server (Ctrl+C) and restart:

```bash
npm run dev
```

You should see:
```
✅ Email service initialized with: youremail@gmail.com
```

### Step 4: Test It! (1 minute)

1. Open: **http://localhost:3000**
2. **Register** with your real email: `yourname@gmail.com`
3. Check your inbox for welcome email! 🎉

---

## What Emails Will You Receive?

| Event | Email Type | When |
|-------|------------|------|
| 🎉 Registration | Welcome Email | Immediately after signup |
| 💸 Money Transfer | Transfer Confirmation | After sending money |
| 💳 Bill Payment | Payment Receipt | After paying a bill |
| ⚠️ Low Balance | Balance Alert | When balance < $1,000 |

---

## Troubleshooting

### ❌ Not receiving emails?

1. **Check console logs:**
   ```
   ✅ Email sent to your@email.com
   ```
   
2. **Check spam folder** in Gmail

3. **Verify `.env` settings:**
   - `EMAIL_ENABLED=true` (not false)
   - `EMAIL_USER` has your correct Gmail
   - `EMAIL_PASSWORD` is the 16-char app password

4. **Restart the server** after changing `.env`

### ⚠️ Gmail App Password not working?

- Ensure **2-Step Verification** is enabled
- Generate a **new** app password
- Make sure you're using **App Password**, not your regular Gmail password
- Check "Less secure app access" is **OFF** (App Passwords are the secure way)

---

## Important Notes

✅ **Use real Gmail addresses** when registering  
✅ **@gmail.com, @yahoo.com, @outlook.com** etc. will work  
❌ **Do NOT use @example.com** - those won't receive emails  

📧 **Email is sent asynchronously** - it won't block the UI  
🔒 **Your credentials are safe** - `.env` is in `.gitignore`  

---

## Need More Help?

See the full guide: **[EMAIL_SETUP_GUIDE.md](EMAIL_SETUP_GUIDE.md)**

- Custom SMTP configuration
- Using Outlook/Yahoo instead of Gmail
- Production email services (SendGrid, Mailgun)
- Email template customization
- Security best practices

---

**Happy Banking! 🏦**
