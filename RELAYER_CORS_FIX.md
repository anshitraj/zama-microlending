# Fixing Relayer CORS Issue

## The Problem

The Zama relayer at `https://relayer.testnet.zama.org` is blocking browser requests due to CORS (Cross-Origin Resource Sharing) restrictions. This is a server-side configuration issue.

**⚠️ IMPORTANT:** The correct domain is `relayer.testnet.zama.org` (`.org`), NOT `relayer.testnet.zama.cloud` (`.cloud`). The `.cloud` domain does not exist and will cause DNS failures.

## Solutions

### Option 1: Use a CORS Browser Extension (Quick Fix for Development)

**For Chrome/Edge:**
1. Install "CORS Unblock" or "Allow CORS: Access-Control-Allow-Origin" extension
2. Enable it for `localhost:3000`
3. Refresh your browser

**⚠️ Warning:** Only use this for development! Never use CORS-disabling extensions in production or with real funds.

### Option 2: Use Local Relayer (Recommended for Development)

1. **Install Docker Desktop** (if not already installed)
   - Download from: https://www.docker.com/products/docker-desktop

2. **Start the local relayer:**
   ```bash
   npm run relayer:start
   ```

3. **Enable local relayer in frontend:**
   - Create/update `frontend/.env`:
   ```env
   VITE_USE_LOCAL_RELAYER=true
   ```

4. **Restart the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

### Option 3: Contact Zama Support

The CORS issue should be fixed on Zama's side. You can:
- Report the issue: https://community.zama.org
- Check service status
- Request CORS headers to be added for browser access

## Current Status

The app will:
- ✅ Show helpful error messages in console
- ✅ Retry initialization automatically (3 attempts)
- ✅ Continue to work (UI visible) even if relayer fails
- ⚠️ Encryption/decryption will fail until relayer is accessible

## Testing Without Relayer

You can still:
- ✅ View the UI
- ✅ Connect your wallet
- ✅ See the form
- ❌ Cannot encrypt/decrypt (requires relayer)

## Next Steps

1. **Try Option 1** (CORS extension) for quick testing
2. **Or use Option 2** (local relayer) for proper development
3. **Report the CORS issue** to Zama if it persists

