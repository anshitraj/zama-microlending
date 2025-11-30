# 🔧 Fix CORS Extension "Bad JSON" Error

## The Problem
Your CORS extension is installed but causing "Bad JSON" errors. This happens when the extension modifies the response incorrectly.

## ✅ Solution 1: Reconfigure CORS Extension

### For "CORS Everywhere" or Similar:

1. **Click the extension icon** in your browser toolbar
2. **Right-click** → **Options** (or click the gear icon)
3. **Disable "Modify response headers"** if that option exists
4. **Make sure it's only adding CORS headers, not modifying content**
5. **Save and refresh** the page

### For "Allow CORS: Access-Control-Allow-Origin":

1. **Click the extension icon**
2. **Enable it** (toggle should be ON/green)
3. **Click "Options"** or settings
4. **Add `localhost:3000`** to allowed origins
5. **Make sure "Modify response" is OFF**
6. **Refresh** the page

## ✅ Solution 2: Try a Different Extension

Uninstall current extension and try:

**Chrome/Edge:**
- **"Allow CORS: Access-Control-Allow-Origin"** (by "Allow CORS")
  - This one is usually more reliable
  - Only adds headers, doesn't modify responses

**Firefox:**
- **"CORS Toggle"** or **"CORS Everywhere"** (Firefox version)

## ✅ Solution 3: Install Docker and Use Local Relayer

This is the **most reliable** solution (no CORS issues at all):

1. **Install Docker Desktop:**
   - Download: https://www.docker.com/products/docker-desktop
   - Install and start Docker Desktop

2. **Start local relayer:**
   ```bash
   npm run relayer:start
   ```

3. **Enable in frontend/.env:**
   ```env
   VITE_USE_LOCAL_RELAYER=true
   ```

4. **Restart frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

5. **Disable CORS extension** (no longer needed!)

## 🔍 Debugging Steps

1. **Open browser DevTools** → **Network tab**
2. **Refresh the page**
3. **Look for the request to `relayer.testnet.zama.org/v1/keyurl`** (Note: `.org` domain, not `.cloud`)
4. **Check the Response** - is it valid JSON or HTML/error?
5. **Check Response Headers** - are CORS headers present?

## ⚠️ Common Issues

- **Extension modifying response body** → Disable "Modify response" option
- **Extension not active** → Click icon, toggle ON
- **Wrong extension** → Try a different one
- **Extension conflict** → Disable other extensions temporarily

## 🎯 Quick Test

After reconfiguring, refresh and check console:
- ✅ Should see: `✅ FHEVM initialized successfully`
- ❌ If still "Bad JSON": Try Solution 3 (local relayer)

