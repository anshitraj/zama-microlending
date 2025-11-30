# Quick Start Guide - Local Relayer Testing

## 🚀 Quick Setup (5 minutes)

### Step 1: Start Local Relayer

```bash
# Make sure Docker is running, then:
npm run relayer:start
```

Wait for: `fhevm-relayer | Started` in the output.

### Step 2: Start Frontend

```bash
cd frontend
npm run dev
```

### Step 3: Test in Browser

1. Open `http://localhost:3000` (or the port Vite shows)
2. Open Browser Console (F12)
3. Connect your MetaMask wallet
4. Fill in the loan form and submit
5. Watch the console for encryption/decryption logs!

## 📊 What You'll See in Console

### On Page Load:
```
🔐 Initializing FHEVM with config: Local (Development)
✅ FHEVM initialized successfully
```

### When Submitting Loan:
```
🔒 Starting encryption...
📦 Encrypting inputs with FHE...
✅ Encryption successful! { inputCount: 4, ... }
```

### When Decrypting:
```
🔓 Starting decryption process...
📥 Fetching encrypted data from contract...
✍️ Creating EIP-712 typed data...
🔐 Requesting user signature...
✅ Signature obtained, sending to relayer...
🎉 Decryption successful! { score: 1100, approved: 'APPROVED' }
```

## 🛑 Stop Everything

```bash
# Stop relayer
npm run relayer:stop

# Stop frontend (Ctrl+C in the frontend terminal)
```

## ❓ Troubleshooting

**Relayer won't start?**
- Check Docker is running: `docker ps`
- Check port 8010 is free: `netstat -an | findstr 8010` (Windows)
- Try: `docker-compose logs` to see errors

**No console logs?**
- Make sure browser console is open (F12)
- Check you're in development mode (not production build)
- Verify relayer is running: `curl http://localhost:8010/health`

**Encryption fails?**
- Ensure wallet is connected
- Check network is Hardhat local (chainId 31337)
- Verify contract is deployed

## 📚 More Info

See [LOCAL_RELAYER_SETUP.md](./LOCAL_RELAYER_SETUP.md) for detailed setup.

