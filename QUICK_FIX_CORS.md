# 🚀 Quick Fix for CORS Error (2 Minutes)

## The Problem
✅ Relayer service is **ONLINE** (90.520% uptime)  
❌ But it's **blocking browser requests** due to CORS

## ⚡ Fastest Solution: CORS Extension (30 seconds)

### Step 1: Install Extension
**For Chrome/Edge:**
- Go to Chrome Web Store
- Search: **"Allow CORS: Access-Control-Allow-Origin"**
- Install the extension (by "Allow CORS" or similar)

**For Firefox:**
- Search: **"CORS Everywhere"** or **"CORS Unblock"**

### Step 2: Enable It
1. Click the extension icon in your browser toolbar
2. Enable it (toggle ON)
3. Make sure it's active for `localhost:3000`

### Step 3: Refresh
- Press `Ctrl + Shift + R` (hard refresh)
- The CORS error should be gone!

## 🐳 Better Solution: Local Relayer (5 minutes)

If you have Docker installed:

### Step 1: Start Local Relayer
```bash
npm run relayer:start
```

Wait for: `fhevm-relayer | Started`

### Step 2: Enable in Frontend
Create/update `frontend/.env`:
```env
VITE_USE_LOCAL_RELAYER=true
```

### Step 3: Restart Frontend
```bash
cd frontend
npm run dev
```

### Step 4: Refresh Browser
- The app will now use your local relayer
- No CORS issues!

## ✅ Verify It's Working

After applying either solution, you should see in the console:
```
🔐 Initializing FHEVM with config: ...
✅ FHEVM initialized successfully
💡 Using Zama's public relayer on Sepolia - no local setup needed!
```

## 🆘 Still Not Working?

1. **Check extension is enabled** (click icon, toggle ON)
2. **Hard refresh**: `Ctrl + Shift + R`
3. **Check console** for new errors
4. **Try local relayer** if extension doesn't work

## 📝 Notes

- **CORS Extension**: Only for development/testing
- **Local Relayer**: More reliable, no external dependencies
- **Production**: Zama should fix CORS on their relayer for production use

