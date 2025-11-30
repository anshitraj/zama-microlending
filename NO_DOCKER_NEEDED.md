# 🎉 No Docker Required!

**Good news:** You can test Zama encryption/decryption **without Docker** by using Zama's public relayer on Sepolia testnet!

## ✅ Option 1: Use Public Relayer (Recommended - No Docker!)

The frontend is **already configured** to use Zama's public relayer by default. Just:

1. **Deploy to Sepolia testnet** (or use existing contract):
   ```bash
   npm run deploy:sepolia
   ```

2. **Update frontend/.env**:
   ```env
   VITE_CONTRACT_ADDRESS=your_sepolia_contract_address
   ```

3. **Start frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

4. **Connect MetaMask to Sepolia testnet** and test!

**That's it!** No Docker needed. The console will show:
```
🔐 Initializing FHEVM with config: Sepolia Public Relayer (No Docker needed!)
✅ FHEVM initialized successfully
💡 Using Zama's public relayer on Sepolia - no local setup needed!
```

## 🐳 Option 2: Use Local Relayer (Requires Docker)

Only use this if you want to test on Hardhat local network (chainId 31337).

1. **Install Docker Desktop** (if not installed):
   - Download from: https://www.docker.com/products/docker-desktop

2. **Enable local relayer** in `frontend/.env`:
   ```env
   VITE_USE_LOCAL_RELAYER=true
   ```

3. **Start relayer**:
   ```bash
   npm run relayer:start
   ```

4. **Start frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

## 🤔 Why Would You Need Docker?

Docker is only needed if you want to:
- Test on **Hardhat local network** (chainId 31337)
- Run a **completely isolated** local environment
- Test **without internet** connection

For most development and testing, **the public Sepolia relayer works perfectly** and is much easier!

## 📊 Comparison

| Feature | Public Relayer (Sepolia) | Local Relayer (Docker) |
|---------|-------------------------|----------------------|
| Setup Time | ⚡ Instant | 🐌 5-10 minutes |
| Docker Required | ❌ No | ✅ Yes |
| Internet Required | ✅ Yes | ❌ No |
| Network | Sepolia Testnet | Hardhat Local |
| Best For | Development & Testing | Offline Testing |

## 🚀 Quick Start (No Docker)

```bash
# 1. Deploy to Sepolia
npm run deploy:sepolia

# 2. Update frontend/.env with contract address

# 3. Start frontend
cd frontend
npm run dev

# 4. Open browser, connect MetaMask to Sepolia, and test!
```

**No Docker installation needed!** 🎉

