
# 🎓 Test Grader Pro - Setup Guide

## 1. Create your .env file
```env
API_KEY=your_gemini_api_key_here
MONGODB_URI=your_standard_connection_string
```

## 2. IMPORTANT: Fix "ECONNREFUSED"
If you get a database error, do NOT use the default `mongodb+srv://` string.
1. Log into **MongoDB Atlas**.
2. Click **Connect** > **Drivers** > **Node.js**.
3. **CRITICAL:** Change the version dropdown to **"2.2.12 or later"**.
4. Use the long string that starts with `mongodb://`. This string works on all networks and avoids DNS errors.

## 3. Whitelist IP
- In Atlas, go to **Network Access**.
- Add IP `0.0.0.0/0` (Allow all) to ensure your local machine can connect.

## 4. Run
```bash
npm install
npm start
```
