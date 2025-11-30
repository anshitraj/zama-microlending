# 🔧 CORS Extension Setup Guide

## If "Bad JSON" Error Persists

The "Bad JSON" error means the CORS extension might be interfering with the response. Try these steps:

### Step 1: Verify Extension is Active

1. **Click the CORS extension icon** in your browser toolbar
2. **Make sure it's toggled ON** (should be green/active)
3. **Check it's enabled for localhost:3000**

### Step 2: Try Different CORS Extension

If "CORS Everywhere" isn't working, try:

**Chrome/Edge:**
- "Allow CORS: Access-Control-Allow-Origin" (by "Allow CORS")
- "CORS Unblock"

**Firefox:**
- "CORS Everywhere" (different from Chrome version)
- "CORS Toggle"

### Step 3: Configure Extension Properly

Some extensions need configuration:

1. **Right-click extension icon** → **Options**
2. **Add localhost:3000** to allowed sites
3. **Enable "Modify response headers"** if available
4. **Save and refresh**

### Step 4: Disable and Use Local Relayer Instead

If CORS extensions keep causing issues:

1. **Disable the CORS extension**
2. **Use local relayer** (more reliable):

```bash
# Start local relayer
npm run relayer:start

# Add to frontend/.env
VITE_USE_LOCAL_RELAYER=true

# Restart frontend
cd frontend
npm run dev
```

## Why "Bad JSON" Happens

- CORS extension modifies response headers
- Relayer expects specific headers
- Extension might be corrupting the JSON response
- Network proxy/firewall interfering

## Best Solution: Local Relayer

The local relayer avoids all CORS issues:
- ✅ No browser extensions needed
- ✅ No CORS problems
- ✅ More reliable for development
- ✅ Works offline

See `LOCAL_RELAYER_SETUP.md` for Docker setup.

