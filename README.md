# Confidential Micro-Lending Engine

A complete confidential micro-lending engine built with Zama's FHEVM protocol. This project demonstrates end-to-end confidential computation: encrypted inputs, encrypted on-chain processing, and client-side decryption.

## 🏗️ Architecture

### Frontend Encryption
The React app uses the Relayer SDK to encrypt borrower inputs (income, repayment score, debt, loan amount) in the browser before sending them on-chain. The SDK's `createEncryptedInput` API registers inputs and returns encrypted handles plus an attestation.

### On-Chain Confidential Computation
The `ConfidentialLending` smart contract accepts `externalEuint*` parameters and a proof. It converts them to encrypted handles using `FHE.fromExternal()`, then computes the risk score homomorphically with `FHE.add`, `FHE.sub`, and `FHE.mul`. It compares the score against a plaintext threshold using `FHE.ge` and uses `FHE.select` to produce an encrypted approval flag. Decryption rights are granted via `FHE.allowForDecryption()` following Zama's best practices.

### User Decryption
The borrower can call `getMyApplication()` to fetch their encrypted score and approval flag. The frontend then uses the Relayer SDK to perform a user decryption flow: it prepares EIP-712 typed data, asks the user to sign it, and sends the signature to the relayer which returns the plaintext.

## 📁 Project Structure

```
.
├── contracts/
│   └── ConfidentialLending.sol    # Main smart contract
├── scripts/
│   └── deploy.ts                    # Deployment script
├── test/
│   └── ConfidentialLending.ts      # Test suite
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoanForm.tsx        # Loan application form
│   │   │   └── ResultPanel.tsx     # Decryption panel
│   │   ├── lib/
│   │   │   └── fhevm.ts            # FHEVM integration
│   │   ├── abis/
│   │   │   └── ConfidentialLending.json
│   │   ├── App.tsx                 # Main app component
│   │   ├── main.tsx                # Entry point
│   │   └── index.css               # Styles
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── hardhat.config.ts
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- MetaMask or compatible Web3 wallet (optional for mock mode)
- Access to Sepolia testnet (for real deployment)

### Installation

1. **Install root dependencies:**
   ```bash
   npm install
   ```

2. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Configure environment variables:**
   
   Create a `.env` file in the root directory:
   ```bash
   RPC_URL=your_sepolia_rpc_url
   PRIVATE_KEY=your_deployer_private_key
   ```
   
   Create a `.env` file in the `frontend` directory:
   ```bash
   cd frontend
   echo "VITE_CONTRACT_ADDRESS=your_contract_address" > .env
   echo "VITE_USE_MOCK_MODE=false" >> .env  # Set to 'true' for demo mode
   ```

### Deployment

1. **Compile the contract:**
   ```bash
   npm run compile
   ```

2. **Deploy to Sepolia:**
   ```bash
   npm run deploy:sepolia
   ```

3. **Update frontend `.env` with the deployed contract address:**
   ```bash
   # In frontend/.env
   VITE_CONTRACT_ADDRESS=0x...
   ```

### Running the Application

#### Demo Mode (Frontend Only - No Blockchain Required)

For quick demos and testing without blockchain interaction:

1. **Enable mock mode in `frontend/.env`:**
   ```bash
   VITE_USE_MOCK_MODE=true
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Use the application:**
   - The app will automatically use mock encryption/decryption
   - No wallet connection needed
   - All data is simulated locally
   - Perfect for demos and presentations

#### Real Mode (Full Blockchain Integration)

1. **Deploy the contract first:**
   ```bash
   npm run deploy:sepolia
   ```

2. **Update `frontend/.env` with contract address:**
   ```bash
   VITE_CONTRACT_ADDRESS=0x...
   VITE_USE_MOCK_MODE=false
   ```

3. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Open your browser:**
   - The app will open at `http://localhost:3000`
   - Connect your MetaMask wallet
   - Make sure you're on the Sepolia network

5. **Use the application:**
   - Fill in the loan application form with your financial data
   - Submit the encrypted application (requires real FHEVM relayer)
   - Click "Decrypt My Status" to see your risk score and approval status

### Testing

Run the test suite:
```bash
npm test
```

### Testing Encryption/Decryption in Browser

**🎉 No Docker Required!** The app uses Zama's public relayer on Sepolia by default.

#### Quick Start (No Docker):

1. **Deploy to Sepolia**:
   ```bash
   npm run deploy:sepolia
   ```

2. **Update `frontend/.env`** with your contract address:
   ```env
   VITE_CONTRACT_ADDRESS=0x...
   ```

3. **Start frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

4. **Connect MetaMask to Sepolia** and test!

5. **Open browser console** (F12) to see:
   - `🔐 Initializing FHEVM with config: Sepolia Public Relayer (No Docker needed!)`
   - `✅ FHEVM initialized successfully`
   - `🔒 Starting encryption...` (when submitting)
   - `✅ Encryption successful!`
   - `🔓 Starting decryption process...` (when decrypting)
   - `🎉 Decryption successful!`

#### Optional: Local Relayer (Requires Docker)

Only needed for Hardhat local network testing. See [NO_DOCKER_NEEDED.md](./NO_DOCKER_NEEDED.md) for details.

## 📝 Usage Flow

1. **Connect Wallet**: Click "Connect Wallet" and approve the connection in MetaMask
2. **Apply for Loan**: Fill in the form with:
   - Monthly Income
   - Repayment Score (0-100)
   - Outstanding Debt
   - Requested Loan Amount
3. **Submit**: Your data is encrypted and sent on-chain
4. **Decrypt Status**: Click "Decrypt My Status" to see your confidential risk score and approval decision

## 🔐 Security Features

- **Fully Homomorphic Encryption**: All sensitive data is encrypted before leaving your browser
- **On-Chain Confidential Computation**: Risk score calculations happen on encrypted data
- **User-Controlled Decryption**: Only you can decrypt your results using your cryptographic signature
- **No Data Leakage**: Even the relayer cannot see your data without your explicit permission

## 🧮 Risk Score Formula

The risk score is calculated as:
```
Score = (Income × 2) + (Repayment Score × 3) - Debt - Loan Amount
```

If the score is greater than or equal to the minimum threshold (default: 1000), the loan is approved.

## 🛠️ Development

### Smart Contract

- **Contract**: `contracts/ConfidentialLending.sol`
- **Network**: Sepolia testnet (configured in `hardhat.config.ts`)
- **FHE Library**: Uses `@fhevm/solidity` for FHE operations (no plugin needed)
- **Testing**: Uses `@zama-fhe/relayer-sdk` directly for encryption/decryption in tests

### Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Web3**: ethers.js v6
- **FHE**: @zama-fhe/relayer-sdk

## 📚 Resources

- [Zama FHEVM Documentation](https://docs.zama.org)
- [Relayer SDK Documentation](https://docs.zama.org/fhevm/relayer-sdk)
- [FHEVM Solidity Library](https://docs.zama.org/fhevm/solidity-library)

## 📄 License

MIT

## 🤝 Contributing

Feel free to extend this project with:
- Lending pools
- Interest calculations
- More sophisticated scoring models
- Multi-party computation features
- Additional privacy-preserving features

