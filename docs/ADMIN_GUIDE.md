# Admin Guide - Confidential Micro-Lending Engine

## Table of Contents

1. [Overview](#overview)
2. [Contract Deployment](#contract-deployment)
3. [Configuration Management](#configuration-management)
4. [Updating Risk Threshold](#updating-risk-threshold)
5. [Monitoring Applications](#monitoring-applications)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Configuration](#advanced-configuration)

---

## Overview

This guide is for administrators and developers who need to deploy, configure, and manage the Confidential Micro-Lending Engine smart contract.

### Admin Responsibilities

- Deploy the smart contract to the blockchain
- Configure the minimum risk score threshold
- Monitor contract activity and applications
- Update contract parameters as needed
- Ensure security best practices

### Prerequisites

- Node.js 18+ and npm
- Hardhat development environment
- Access to Sepolia testnet (or mainnet for production)
- Private key with sufficient ETH for deployment
- Understanding of Solidity and FHEVM

---

## Contract Deployment

### Step 1: Environment Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create `.env` file** in the root directory:
   ```env
   RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
   PRIVATE_KEY=your_deployer_private_key_here
   ```

   **⚠️ Security Warning**: Never commit your `.env` file to version control!

3. **Verify `.gitignore`** includes `.env`:
   ```gitignore
   .env
   .env.local
   ```

### Step 2: Compile the Contract

```bash
npm run compile
```

This will:
- Compile `ConfidentialLending.sol`
- Generate ABI files in `artifacts/`
- Check for compilation errors

### Step 3: Deploy to Sepolia

```bash
npm run deploy:sepolia
```

**What happens**:
1. Contract is compiled (if not already)
2. Deployment script connects to Sepolia via RPC
3. Contract is deployed with initial threshold (default: 1000)
4. Deployment address is printed to console

**Example output**:
```
Deploying ConfidentialLending...
Contract deployed to: 0xb47052aA34DfCbADa54F2BBFEEBa66172C45E937
Transaction hash: 0x...
```

### Step 4: Update Frontend Configuration

After deployment, update `frontend/.env`:

```env
VITE_CONTRACT_ADDRESS=0xb47052aA34DfCbADa54F2BBFEEBa66172C45E937
VITE_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
VITE_CHAIN_ID=11155111
VITE_RELAYER_URL=https://relayer.testnet.zama.org
VITE_GATEWAY_URL=https://gateway.testnet.zama.org
```

### Step 5: Verify Deployment

1. **Check on Etherscan**:
   - Visit [sepolia.etherscan.io](https://sepolia.etherscan.io)
   - Search for your contract address
   - Verify contract code is visible

2. **Test contract functions**:
   ```bash
   npm test
   ```

---

## Configuration Management

### Contract Parameters

The `ConfidentialLending` contract has the following configurable parameters:

#### `minScoreForApproval` (uint64)

**Purpose**: Minimum risk score required for loan approval

**Default**: `1000`

**Impact**: 
- Higher threshold = stricter approval criteria
- Lower threshold = more lenient approval criteria

**Formula Context**:
```
Score = (Income × 2) + (Repayment Score × 3) - Debt - Loan Amount
```

**Example Scenarios**:

| Threshold | Income | Score | Debt | Loan | Result |
|-----------|--------|-------|------|------|--------|
| 1000 | $5,000 | 85 | $2,000 | $10,000 | Rejected (255) |
| 1000 | $8,000 | 95 | $1,000 | $5,000 | Approved (10,085) |
| 500 | $5,000 | 85 | $2,000 | $10,000 | Rejected (255) |
| 200 | $5,000 | 85 | $2,000 | $10,000 | Approved (255) |

### Setting Initial Threshold

When deploying, you can set a custom threshold:

```typescript
// scripts/deploy.ts
const threshold = 1000; // Custom threshold
const contract = await ConfidentialLending.deploy(threshold);
```

---

## Updating Risk Threshold

### Method 1: Using Hardhat Console

1. **Start Hardhat console**:
   ```bash
   npx hardhat console --network sepolia
   ```

2. **Connect to deployed contract**:
   ```javascript
   const ConfidentialLending = await ethers.getContractFactory("ConfidentialLending");
   const contract = ConfidentialLending.attach("0x..."); // Your contract address
   ```

3. **Check current threshold**:
   ```javascript
   const current = await contract.minScoreForApproval();
   console.log("Current threshold:", current.toString());
   ```

4. **Update threshold** (requires admin account):
   ```javascript
   const [admin] = await ethers.getSigners();
   const newThreshold = 1500; // New threshold
   const tx = await contract.connect(admin).updateThreshold(newThreshold);
   await tx.wait();
   console.log("Threshold updated!");
   ```

### Method 2: Using Script

Create a script `scripts/updateThreshold.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS!;
  const newThreshold = process.env.NEW_THRESHOLD || "1500";
  
  const contract = await ethers.getContractAt(
    "ConfidentialLending",
    contractAddress
  );
  
  const tx = await contract.updateThreshold(newThreshold);
  await tx.wait();
  
  console.log(`Threshold updated to ${newThreshold}`);
}

main().catch(console.error);
```

Run it:
```bash
CONTRACT_ADDRESS=0x... NEW_THRESHOLD=1500 npx hardhat run scripts/updateThreshold.ts --network sepolia
```

### Method 3: Using Frontend (Future Feature)

A future admin panel could allow threshold updates through the UI.

---

## Monitoring Applications

### Viewing Contract Events

The contract emits `LoanApplied` events when users submit applications:

```typescript
// Listen for new applications
contract.on("LoanApplied", (borrower, event) => {
  console.log("New application from:", borrower);
});
```

### Querying Applications

**Note**: Applications are encrypted, so you can only see that they exist, not their contents.

```typescript
// Check if user has an application
const hasApplication = await contract.applications(userAddress).exists;
console.log("Has application:", hasApplication);
```

### Using Etherscan

1. Visit your contract on [Etherscan](https://sepolia.etherscan.io)
2. Go to "Events" tab
3. Filter by `LoanApplied` event
4. See all application submissions (addresses only, data is encrypted)

---

## Security Best Practices

### 1. Private Key Management

**❌ Never**:
- Commit private keys to version control
- Share private keys
- Use mainnet private keys in development
- Store private keys in plain text

**✅ Always**:
- Use environment variables for private keys
- Use separate keys for testnet and mainnet
- Use hardware wallets for production
- Rotate keys regularly

### 2. Access Control

The contract has an `admin` address that can update the threshold:

```solidity
function updateThreshold(uint64 newThreshold) external {
    require(msg.sender == admin, "Only admin");
    minScoreForApproval = newThreshold;
}
```

**Best Practices**:
- Use a multisig wallet for admin in production
- Consider time-locked changes for threshold updates
- Monitor admin actions

### 3. Contract Upgradability

**Current Status**: Contract is not upgradeable (immutable)

**For Production**:
- Consider using proxy patterns (e.g., UUPS, Transparent Proxy)
- Implement upgrade governance
- Plan for emergency pauses if needed

### 4. Threshold Management

**Considerations**:
- **Too Low**: May approve risky loans
- **Too High**: May reject legitimate borrowers
- **Dynamic**: Consider market conditions, risk models

**Recommendation**: Start conservative and adjust based on data

### 5. Monitoring and Alerts

Set up monitoring for:
- Unusual application patterns
- Failed transactions
- Threshold changes
- Contract balance (if accepting deposits)

---

## Troubleshooting

### Deployment Fails

**Problem**: `HH117: Empty string for network URL`

**Solution**:
1. Check `.env` file exists
2. Verify `RPC_URL` is set correctly
3. Ensure `dotenv` is installed and configured

**Problem**: `Insufficient funds`

**Solution**:
1. Check deployer account has enough ETH
2. Get test ETH from faucet (testnet)
3. Check gas price settings

### Contract Functions Fail

**Problem**: `Only admin` error

**Solution**:
1. Verify you're using the admin account
2. Check contract was deployed with your address as admin
3. Use `contract.admin()` to check current admin

**Problem**: Transaction reverts

**Solution**:
1. Check gas limit is sufficient
2. Verify contract address is correct
3. Check network is correct (Sepolia)
4. Review contract requirements

### Frontend Can't Connect

**Problem**: Frontend shows "Contract not found"

**Solution**:
1. Verify `VITE_CONTRACT_ADDRESS` in `frontend/.env`
2. Check contract is deployed on correct network
3. Verify ABI file is up to date
4. Check RPC URL is accessible

---

## Advanced Configuration

### Custom Risk Score Formula

To modify the risk score calculation, edit `contracts/ConfidentialLending.sol`:

```solidity
// Current formula:
euint64 score = FHE.sub(
    FHE.sub(
        FHE.add(
            FHE.mul(income, 2),
            FHE.mul(FHE.asEuint64(repaymentScore), 3)
        ),
        debt
    ),
    loanAmount
);

// Custom formula example (weighted differently):
euint64 score = FHE.sub(
    FHE.sub(
        FHE.add(
            FHE.mul(income, 3),  // Income weight: 3 (was 2)
            FHE.mul(FHE.asEuint64(repaymentScore), 2)  // Score weight: 2 (was 3)
        ),
        FHE.mul(debt, 2)  // Debt penalty: 2x (was 1x)
    ),
    loanAmount
);
```

**⚠️ Warning**: Changing the formula requires:
1. Recompiling the contract
2. Redeploying
3. Updating frontend if needed
4. Testing thoroughly

### Multiple Thresholds

For more complex approval logic, consider:

```solidity
struct ApprovalTiers {
    uint64 excellent;  // >= 2000
    uint64 good;       // >= 1000
    uint64 fair;       // >= 500
}

mapping(uint8 => uint64) public thresholds;
```

### Event Logging

Add more events for better monitoring:

```solidity
event ThresholdUpdated(uint64 oldThreshold, uint64 newThreshold);
event ApplicationProcessed(address indexed borrower, bool approved);
```

---

## Production Checklist

Before deploying to mainnet:

- [ ] Security audit completed
- [ ] All tests passing
- [ ] Threshold value validated
- [ ] Admin address secured (multisig)
- [ ] Monitoring set up
- [ ] Documentation updated
- [ ] Frontend tested with production contract
- [ ] Gas optimization reviewed
- [ ] Emergency procedures documented
- [ ] Legal compliance verified

---

## Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Zama FHEVM Documentation](https://docs.zama.org)
- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [Solidity Documentation](https://docs.soliditylang.org)

---

**Last Updated**: December 2024  
**Version**: 1.0.0

