# Environment Setup Guide

## 🔧 Setting Up .env File

You need to configure your `.env` file to deploy to Sepolia testnet.

### Step 1: Get a Sepolia RPC URL

Choose one of these free services:

#### Option A: Infura (Recommended)
1. Go to https://infura.io
2. Sign up for a free account
3. Create a new project
4. Select "Sepolia" network
5. Copy the HTTPS URL (looks like: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`)

#### Option B: Alchemy
1. Go to https://alchemy.com
2. Sign up for a free account
3. Create a new app
4. Select "Sepolia" network
5. Copy the HTTPS URL

#### Option C: QuickNode
1. Go to https://quicknode.com
2. Sign up and create a Sepolia endpoint
3. Copy the HTTPS URL

### Step 2: Get Your Private Key

1. Open MetaMask
2. Click the three dots (⋮) next to your account
3. Select "Account Details"
4. Click "Show Private Key"
5. Enter your password
6. Copy the private key (remove the `0x` prefix if present)

⚠️ **Security Warning:** Never share your private key or commit it to git!

### Step 3: Create/Update .env File

Create a `.env` file in the project root with:

```env
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=your_private_key_without_0x_prefix
```

**Example:**
```env
RPC_URL=https://sepolia.infura.io/v3/abc123def456ghi789
PRIVATE_KEY=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### Step 4: Verify Setup

Check that your .env file is properly configured:

```powershell
# Windows PowerShell
Get-Content .env
```

You should see both `RPC_URL` and `PRIVATE_KEY` set.

### Step 5: Deploy

Now you can deploy:

```bash
npm run deploy:sepolia
```

After deployment, update `frontend/.env`:

```env
VITE_CONTRACT_ADDRESS=0x...your_deployed_contract_address...
```

## 🔒 Security Best Practices

1. ✅ **DO:**
   - Keep `.env` in `.gitignore` (already done)
   - Use a separate wallet for testing
   - Never commit private keys

2. ❌ **DON'T:**
   - Share your `.env` file
   - Use your main wallet's private key
   - Commit `.env` to version control

## 🆘 Troubleshooting

**Error: "Empty string for network URL"**
- Check that `RPC_URL` is set in `.env`
- Make sure there are no extra spaces
- Verify the URL is correct

**Error: "Invalid private key"**
- Ensure private key doesn't have `0x` prefix
- Check for extra spaces or newlines
- Verify it's 64 characters (32 bytes in hex)

**Error: "Insufficient funds"**
- Get Sepolia ETH from a faucet:
  - https://sepoliafaucet.com
  - https://faucet.quicknode.com/ethereum/sepolia
  - https://www.alchemy.com/faucets/ethereum-sepolia

