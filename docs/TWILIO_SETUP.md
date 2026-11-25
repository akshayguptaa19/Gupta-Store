# Twilio SMS Setup - Real OTP Kaise Bheje Phone Pe

## Step 1: Twilio Account Banao
1. Go to **https://www.twilio.com/try-twilio**
2. Sign up with your email
3. Verify your phone number (India = +91)

## Step 2: Twilio Console se Credentials Nikal

After login, you'll see your Dashboard:

```
Account SID:    ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token:     your_auth_token_here
Phone Number:   +1234567890 (Twilio ka number)
```

**Note:** Twilio free trial mein US number milta hai, but it can send SMS to India.

## Step 3: .env.local File Banao

Project root mein ek `.env.local` file banao:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# Optional: Razorpay (for payments)
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx

# Optional: MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/gupta-store
MONGODB_DB_NAME=gupta-store
```

## Step 4: Restart Development Server

```bash
npm run dev
```

## Step 5: Test Karo

1. Go to `http://localhost:3000/auth`
2. Click "Register" tab
3. Enter your **actual phone number** (starting with 10 digits like 9876543210)
4. Click "Send OTP"
5. **Check your phone** - SMS ayega 30 seconds mein! 📱

## Kya Hota Hai?

### Before (Without Twilio credentials):
- Demo OTP dikhai deta hai browser mein (testing ke liye)
- Real SMS nahi jaata

### After (With Twilio credentials):
- OTP real phone par SMS se aata hai ✅
- Demo OTP browser mein nahi dikhega
- Production mode jaise kaam karega

## Common Issues

### "OTP send failed" error?
- Check TWILIO_ACCOUNT_SID and AUTH_TOKEN are correct
- Restart `npm run dev` after adding env variables
- Phone number format check: should be 10 digits for India

### Phone number not receiving SMS?
- Make sure Twilio account is active (free trial works)
- Wait 30-60 seconds, SMS ko time lagta hai
- Check phone ka SMS history
- Verify +91 country code added correctly

### "Twilio is not configured" message?
- `.env.local` file mein variables add nahi ho gaye
- Restart server `Ctrl+C` aur phir `npm run dev`

## Get Free Twilio Credits

Twilio free trial:
- $15 starting credit
- Can send 100s of SMS easily
- Valid for 30 days
- Just add credit card (won't charge without approval)

**Link:** https://www.twilio.com/try-twilio

---

## Example `.env.local` (Fill these values):

```
TWILIO_ACCOUNT_SID=AC1234567890abcdef1234567890abcd
TWILIO_AUTH_TOKEN=abcdef1234567890abcdef1234567890
TWILIO_PHONE_NUMBER=+1234567890
```

Once added, OTP will work on **real phone** ✅
