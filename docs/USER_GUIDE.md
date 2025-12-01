# User Guide - Confidential Micro-Lending Engine

## Table of Contents

1. [Getting Started](#getting-started)
2. [Connecting Your Wallet](#connecting-your-wallet)
3. [Applying for a Loan](#applying-for-a-loan)
4. [Checking Your Loan Status](#checking-your-loan-status)
5. [Using the Calculator](#using-the-calculator)
6. [Understanding Financial Terms](#understanding-financial-terms)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

---

## Getting Started

### What is Confidential Micro-Lending?

The Confidential Micro-Lending Engine is a privacy-preserving lending platform built on Zama's FHEVM technology. Your financial data is **never revealed** on the blockchain - everything is encrypted before leaving your device.

### Key Features

✅ **Complete Privacy** - Your income, debt, and loan details are encrypted  
✅ **Fair Evaluation** - Risk scores are calculated fairly on encrypted data  
✅ **User Control** - Only you can decrypt your loan status  
✅ **Transparent Process** - All calculations are verifiable on-chain  

### Prerequisites

- **MetaMask Wallet** (or compatible Web3 wallet)
- **Sepolia Testnet** - Make sure your wallet is connected to Ethereum Sepolia
- **Test ETH** - You'll need Sepolia ETH for gas fees (get free test ETH from [faucets](https://sepoliafaucet.com))

---

## Connecting Your Wallet

### Step 1: Install MetaMask

If you don't have MetaMask installed:

1. Visit [metamask.io](https://metamask.io)
2. Click "Download" and install the browser extension
3. Create a new wallet or import an existing one
4. **Important**: Save your seed phrase securely!

### Step 2: Connect to Sepolia Testnet

1. Open MetaMask
2. Click the network dropdown (usually shows "Ethereum Mainnet")
3. Select "Sepolia" from the list
4. If Sepolia isn't listed:
   - Click "Add Network"
   - Network Name: `Sepolia`
   - RPC URL: `https://rpc.sepolia.org`
   - Chain ID: `11155111`
   - Currency Symbol: `ETH`

### Step 3: Get Test ETH

1. Visit a Sepolia faucet (e.g., [sepoliafaucet.com](https://sepoliafaucet.com))
2. Enter your wallet address
3. Request test ETH (usually takes a few minutes)

### Step 4: Connect to the App

1. Open the Confidential Micro-Lending application
2. Click the **"🔗 Connect Wallet"** button in the header
3. MetaMask will pop up asking for permission
4. Click **"Connect"** to approve
5. Your wallet address will appear in the header (e.g., `0x2De9...b32b`)

---

## Applying for a Loan

### Understanding the Application Form

The loan application requires four pieces of financial information:

1. **Monthly Income ($)**
   - Your total monthly income from all sources
   - Example: `5000` for $5,000/month

2. **Repayment Score (0-100)**
   - Your creditworthiness score
   - Higher is better (100 = excellent)
   - Example: `85` for a good score

3. **Outstanding Debt ($)**
   - Total amount of existing debt
   - Example: `2000` for $2,000 in debt

4. **Requested Loan Amount ($)**
   - How much you want to borrow
   - Example: `10000` for $10,000

### Step-by-Step Application Process

1. **Navigate to "Apply for Loan"** page
2. **Fill in the form** with your financial information
3. **Review your inputs** - The calculator shows your estimated risk score in real-time
4. **Click "Apply Securely"** button
5. **Approve the transaction** in MetaMask:
   - Review the transaction details
   - Confirm the gas fee
   - Click "Confirm"
6. **Wait for confirmation** - The transaction will be processed on-chain
7. **Success!** - Your encrypted application is now stored on the blockchain

### What Happens Behind the Scenes?

1. **Encryption**: Your data is encrypted in your browser before leaving your device
2. **On-Chain Processing**: The smart contract calculates your risk score on encrypted data
3. **Storage**: Encrypted results are stored on the blockchain
4. **Privacy**: No one can see your financial data - not even the blockchain validators!

---

## Checking Your Loan Status

### Decrypting Your Application

After submitting your loan application, you can check your status:

1. **Navigate to "My Status"** page
2. **Click "Decrypt My Status"** button
3. **Sign the message** in MetaMask:
   - A popup will ask you to sign a message
   - This signature is used to decrypt your results
   - Click "Sign" to approve
4. **View your results**:
   - **Risk Score**: Your calculated risk score
   - **Status**: Approved ✅ or Rejected ❌
   - **Minimum Score**: The threshold required for approval

### Understanding Your Results

**Risk Score Formula**:
```
Score = (Income × 2) + (Repayment Score × 3) - Debt - Loan Amount
```

**Example**:
- Income: $5,000 → `5,000 × 2 = 10,000`
- Repayment Score: 85 → `85 × 3 = 255`
- Debt: $2,000 → `-2,000`
- Loan Amount: $10,000 → `-10,000`
- **Total Score**: `10,000 + 255 - 2,000 - 10,000 = -1,745`

**Approval Criteria**:
- If `Score >= 1000` → **Approved** ✅
- If `Score < 1000` → **Rejected** ❌

---

## Using the Calculator

The **Calculator** page helps you estimate your loan eligibility before applying:

### Features

1. **Real-Time Calculation**: See your risk score as you type
2. **Eligibility Indicator**: Green checkmark if you qualify, red X if not
3. **Qualification Criteria**: See what scores are needed

### How to Use

1. **Navigate to "Calculator"** page
2. **Enter your financial information**:
   - Monthly Income
   - Repayment Score
   - Outstanding Debt
   - Desired Loan Amount
3. **View your estimated score** in real-time
4. **Check eligibility** - The calculator shows if you'd be approved

### Tips for Better Scores

- **Increase Income**: Higher income = higher score
- **Improve Repayment Score**: Better credit = higher score
- **Reduce Debt**: Less debt = higher score
- **Lower Loan Amount**: Smaller loans = higher score

---

## Understanding Financial Terms

Click the **"ℹ️"** button (top right) to see definitions of financial terms:

### Key Terms

- **Monthly Income**: Total income from all sources per month
- **Repayment Score**: Creditworthiness indicator (0-100)
- **Outstanding Debt**: Current total debt obligations
- **Loan Amount**: Amount you want to borrow
- **Risk Score**: Calculated score determining loan approval
- **Minimum Score**: Threshold required for approval (default: 1000)

### Recommendations

- **Income**: Should be stable and verifiable
- **Repayment Score**: Aim for 70+ for better chances
- **Debt-to-Income Ratio**: Keep debt below 30% of income
- **Loan Amount**: Request only what you need

---

## Troubleshooting

### Wallet Connection Issues

**Problem**: "Connect Wallet" button doesn't work

**Solutions**:
1. Make sure MetaMask is installed and unlocked
2. Refresh the page
3. Check if MetaMask is on Sepolia network
4. Try disconnecting and reconnecting

### Transaction Fails

**Problem**: Transaction fails when applying for loan

**Solutions**:
1. Check you have enough Sepolia ETH for gas
2. Increase gas limit in MetaMask
3. Make sure you're on Sepolia network
4. Try again after a few seconds

### Decryption Fails

**Problem**: Can't decrypt loan status

**Solutions**:
1. Make sure you've submitted a loan application
2. Wait for transaction confirmation
3. Check your wallet is connected
4. Try signing the message again

### Network Errors

**Problem**: "Wrong network" warning

**Solutions**:
1. Switch MetaMask to Sepolia testnet
2. Refresh the page
3. Reconnect your wallet

### FHEVM Not Initializing

**Problem**: App shows "FHEVM not ready"

**Solutions**:
1. Check your internet connection
2. Make sure MetaMask is connected
3. Refresh the page
4. Check browser console for errors

---

## FAQ

### Q: Is my data really private?

**A**: Yes! Your financial data is encrypted before leaving your browser and remains encrypted on the blockchain. Only you can decrypt your results using your cryptographic signature.

### Q: Do I need to pay for this?

**A**: You only need Sepolia test ETH for gas fees (transaction costs). The test ETH is free from faucets.

### Q: Can I apply multiple times?

**A**: Yes, but each application overwrites your previous one. You can only have one active application at a time.

### Q: How long does it take?

**A**: 
- Application submission: ~15-30 seconds (blockchain confirmation)
- Decryption: ~2-5 seconds (relayer processing)

### Q: What if I'm rejected?

**A**: You can improve your financial profile and apply again. The calculator helps you see what changes would help.

### Q: Is this on mainnet?

**A**: No, this is currently on Sepolia testnet for testing purposes. Mainnet deployment would require additional security audits.

### Q: Can I see other people's applications?

**A**: No! All data is encrypted. You can only see and decrypt your own application.

### Q: What happens if I lose my wallet?

**A**: If you lose access to your wallet, you won't be able to decrypt your application. Always backup your MetaMask seed phrase securely!

### Q: How is the risk score calculated?

**A**: 
```
Score = (Income × 2) + (Repayment Score × 3) - Debt - Loan Amount
```
If the score is >= 1000, you're approved.

### Q: Can I change my application after submitting?

**A**: No, but you can submit a new application which will overwrite the previous one.

---

## Support

If you encounter issues not covered in this guide:

1. Check the browser console (F12) for error messages
2. Review the [FHEVM Integration Documentation](./FHEVM_INTEGRATION.md)
3. Check [Zama Documentation](https://docs.zama.org)
4. Contact support through the project repository

---

**Last Updated**: December 2024  
**Version**: 1.0.0

