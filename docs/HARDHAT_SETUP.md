# Hardhat Setup Guide

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Available Scripts](#available-scripts)
6. [Compiling Contracts](#compiling-contracts)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Network Configuration](#network-configuration)
10. [Troubleshooting](#troubleshooting)
11. [Advanced Usage](#advanced-usage)

---

## Overview

This project uses **Hardhat** as the development environment for compiling, testing, and deploying Solidity smart contracts that leverage Zama's FHEVM protocol.

### Key Features

- ✅ **Solidity 0.8.24** - Latest Solidity compiler
- ✅ **TypeScript Support** - Full TypeScript support for scripts and tests
- ✅ **Ethers.js v6** - Modern Ethereum library integration
- ✅ **FHEVM Integration** - Direct integration with `@fhevm/solidity`
- ✅ **Environment Variables** - Secure configuration via `.env`
- ✅ **Multiple Networks** - Support for Hardhat local network and Sepolia testnet

### Technology Stack

- **Hardhat**: `^2.19.4`
- **Solidity**: `^0.8.24`
- **Ethers.js**: `^6.9.0`
- **TypeScript**: `^5.3.3`
- **@fhevm/solidity**: `^0.9.1`
- **@zama-fhe/relayer-sdk**: `^0.2.0`

---

## Project Structure

```
.
├── contracts/
│   └── ConfidentialLending.sol    # Main smart contract
├── scripts/
│   └── deploy.ts                  # Deployment script
├── test/
│   └── ConfidentialLending.ts    # Test suite
├── artifacts/                     # Compiled contracts (generated)
├── cache/                         # Hardhat cache (generated)
├── hardhat.config.ts              # Hardhat configuration
├── tsconfig.json                  # TypeScript configuration
├── package.json                   # Dependencies and scripts
└── .env                          # Environment variables (not in git)
```

---

## Installation

### Prerequisites

- **Node.js**: 18+ (recommended: 20.x)
- **npm**: 9+ (comes with Node.js)
- **Git**: For version control

### Step 1: Install Dependencies

```bash
npm install
```

This installs:
- Hardhat and plugins
- Ethers.js v6
- TypeScript and type definitions
- FHEVM Solidity library
- Zama Relayer SDK
- Testing libraries (Chai, Mocha)

### Step 2: Verify Installation

```bash
npx hardhat --version
```

Should output: `2.19.4` (or similar)

---

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# RPC URL for Sepolia testnet
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Private key of deployer account (with leading 0x)
PRIVATE_KEY=0x your_private_key_here

# Optional: Contract address (after deployment)
CONTRACT_ADDRESS=0x...
```

**⚠️ Security Warning**: 
- Never commit `.env` to version control
- Use testnet private keys only (never mainnet)
- Consider using a separate account for testing

### Hardhat Configuration

The `hardhat.config.ts` file is already configured:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    sepolia: {
      url: process.env.RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};

export default config;
```

**Key Points**:
- **Solidity 0.8.24**: Required for FHEVM compatibility
- **Optimizer**: Enabled with 200 runs for gas optimization
- **Networks**: Hardhat (local) and Sepolia (testnet)
- **Environment Variables**: Loaded via `dotenv`

---

## Available Scripts

### Compile Contracts

```bash
npm run compile
```

**What it does**:
- Compiles all Solidity contracts in `contracts/`
- Generates ABIs in `artifacts/`
- Creates type definitions for TypeScript
- Caches compilation results

**Output**:
```
Compiled 1 Solidity file successfully
```

### Run Tests

```bash
npm test
```

**What it does**:
- Runs all tests in `test/` directory
- Uses Hardhat local network
- Tests contract functionality with FHEVM

**Note**: Tests require a local relayer (see [Testing](#testing))

### Deploy to Sepolia

```bash
npm run deploy:sepolia
```

**What it does**:
- Compiles contracts (if needed)
- Deploys `ConfidentialLending` to Sepolia
- Uses account from `PRIVATE_KEY` in `.env`
- Prints contract address

**Output**:
```
Deploying ConfidentialLending...
Contract deployed to: 0xb47052aA34DfCbADa54F2BBFEEBa66172C45E937
```

### Deploy to Local Network

```bash
npm run deploy:local
```

**What it does**:
- Deploys to Hardhat's local network
- Useful for testing without spending gas
- Network resets after script completes

### Relayer Management (Optional)

For local testing with a relayer:

```bash
# Start local relayer (requires Docker)
npm run relayer:start

# Stop local relayer
npm run relayer:stop

# View relayer logs
npm run relayer:logs
```

**Note**: For Sepolia, use Zama's public relayer (no Docker needed).

---

## Compiling Contracts

### Basic Compilation

```bash
npx hardhat compile
```

### Compilation Options

**Force Recompilation**:
```bash
npx hardhat clean
npx hardhat compile
```

**Verbose Output**:
```bash
npx hardhat compile --verbose
```

### Compilation Output

After compilation, you'll find:

- **ABIs**: `artifacts/contracts/ConfidentialLending.sol/ConfidentialLending.json`
- **Bytecode**: In the same JSON file
- **Type Definitions**: Generated automatically for TypeScript

### Using Compiled Contracts

In TypeScript:

```typescript
import { ethers } from "hardhat";

const ConfidentialLending = await ethers.getContractFactory("ConfidentialLending");
const contract = await ConfidentialLending.deploy(1000);
```

---

## Testing

### Test Structure

Tests are located in `test/ConfidentialLending.ts`:

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { createInstance } from "@zama-fhe/relayer-sdk/node";

describe("ConfidentialLending", function () {
  // Test cases
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/ConfidentialLending.ts

# Run with gas reporting
REPORT_GAS=true npx hardhat test
```

### Test Requirements

**For Local Testing**:
- Local relayer running (via Docker)
- See `docker-compose.yml` for setup

**For Sepolia Testing**:
- Use Zama's public relayer
- Update test config to use `SepoliaConfig`

### Writing Tests

Example test structure:

```typescript
it("should accept encrypted loan request", async function () {
  const [deployer, borrower] = await ethers.getSigners();
  
  // Deploy contract
  const contract = await ConfidentialLending.deploy(1000);
  
  // Encrypt inputs
  const enc = await fhevmInstance.createEncryptedInput(
    contractAddress,
    borrowerAddress
  );
  enc.add64(income);
  enc.add16(repaymentScore);
  // ... more inputs
  
  const { inputs, attestation } = await enc.encrypt();
  
  // Submit to contract
  await contract.connect(borrower).applyForLoan(
    inputs[0], inputs[1], inputs[2], inputs[3], attestation
  );
  
  // Decrypt and verify
  const decrypted = await fhevmInstance.userDecrypt(...);
  expect(decrypted[0]).to.equal(expectedScore);
});
```

---

## Deployment

### Deployment Script

The deployment script (`scripts/deploy.ts`):

```typescript
import { ethers } from "hardhat";

async function main() {
  const threshold = 1000;
  const ConfidentialLending = await ethers.getContractFactory("ConfidentialLending");
  const contract = await ConfidentialLending.deploy(threshold);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`ConfidentialLending deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### Deploying to Sepolia

1. **Set up `.env`**:
   ```env
   RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
   PRIVATE_KEY=0x your_key_here
   ```

2. **Get Sepolia ETH**:
   - Visit [sepoliafaucet.com](https://sepoliafaucet.com)
   - Request test ETH to your deployer address

3. **Deploy**:
   ```bash
   npm run deploy:sepolia
   ```

4. **Verify Deployment**:
   - Check on [Etherscan](https://sepolia.etherscan.io)
   - Search for your contract address

### Custom Deployment

Modify `scripts/deploy.ts` for custom parameters:

```typescript
async function main() {
  // Custom threshold
  const threshold = 1500;
  
  // Deploy with custom threshold
  const contract = await ConfidentialLending.deploy(threshold);
  
  // Additional setup...
  await contract.waitForDeployment();
  
  console.log(`Deployed with threshold: ${threshold}`);
}
```

---

## Network Configuration

### Hardhat Local Network

**Default Configuration**:
- Chain ID: `31337`
- Block time: `0` (instant)
- Accounts: 20 test accounts with 10000 ETH each

**Usage**:
```bash
npx hardhat node
```

**Features**:
- Instant transactions
- Free gas
- Perfect for testing
- Resets on restart

### Sepolia Testnet

**Configuration**:
- Chain ID: `11155111`
- RPC URL: From `.env` or public RPC
- Gas Price: Auto (network default)

**Setup**:
1. Add RPC URL to `.env`
2. Add private key to `.env`
3. Get test ETH from faucet

**Public RPC Endpoints**:
- `https://rpc.sepolia.org` (Ethereum Foundation)
- `https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY` (Alchemy)
- `https://sepolia.infura.io/v3/YOUR_KEY` (Infura)

### Adding Custom Networks

Edit `hardhat.config.ts`:

```typescript
networks: {
  custom: {
    url: "https://custom-rpc-url.com",
    accounts: [process.env.PRIVATE_KEY || ""],
    chainId: 12345,
  },
}
```

---

## Troubleshooting

### Compilation Errors

**Problem**: `Error: Solidity version mismatch`

**Solution**:
- Ensure `hardhat.config.ts` specifies `0.8.24`
- Check contract pragma matches: `pragma solidity ^0.8.24;`

**Problem**: `Error: Cannot find module '@fhevm/solidity'`

**Solution**:
```bash
npm install @fhevm/solidity@^0.9.1
```

### Deployment Errors

**Problem**: `HH117: Empty string for network URL`

**Solution**:
- Check `.env` file exists
- Verify `RPC_URL` is set
- Ensure `dotenv.config()` is in `hardhat.config.ts`

**Problem**: `Insufficient funds`

**Solution**:
- Check deployer account has enough ETH
- Get test ETH from faucet (testnet)
- Verify private key is correct

**Problem**: `Nonce too high`

**Solution**:
- Reset nonce in MetaMask
- Wait for pending transactions
- Use a fresh account

### Test Errors

**Problem**: `Could not initialize FHEVM instance`

**Solution**:
- Start local relayer: `npm run relayer:start`
- Or update test to use Sepolia config
- Check relayer URL is correct

**Problem**: `Timeout waiting for transaction`

**Solution**:
- Increase timeout in test: `this.timeout(60000)`
- Check network connection
- Verify contract deployment succeeded

### Network Connection Issues

**Problem**: `ECONNREFUSED` or network errors

**Solution**:
- Check RPC URL is correct
- Verify internet connection
- Try different RPC endpoint
- Check if RPC requires API key

---

## Advanced Usage

### Hardhat Console

Interactive console for testing:

```bash
npx hardhat console --network sepolia
```

**Example Usage**:
```javascript
const ConfidentialLending = await ethers.getContractFactory("ConfidentialLending");
const contract = ConfidentialLending.attach("0x...");
const threshold = await contract.minScoreForApproval();
console.log("Threshold:", threshold.toString());
```

### Gas Reporting

Enable gas reporting in tests:

```typescript
// hardhat.config.ts
import "hardhat-gas-reporter";

const config: HardhatUserConfig = {
  gasReporter: {
    enabled: true,
  },
  // ...
};
```

### Contract Verification

Verify contract on Etherscan:

```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS 1000
```

**Requirements**:
- Contract source code
- Constructor arguments
- Etherscan API key in `.env`

### Custom Tasks

Create custom Hardhat tasks:

```typescript
// hardhat.config.ts
import { task } from "hardhat/config";

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();
  for (const account of accounts) {
    console.log(account.address);
  }
});
```

Run with:
```bash
npx hardhat accounts
```

### Forking Mainnet

Test against mainnet state:

```typescript
// hardhat.config.ts
networks: {
  hardhat: {
    forking: {
      url: process.env.MAINNET_RPC_URL || "",
    },
  },
}
```

---

## Best Practices

### 1. Environment Variables

- ✅ Use `.env` for sensitive data
- ✅ Add `.env` to `.gitignore`
- ✅ Use different keys for testnet/mainnet
- ❌ Never commit private keys

### 2. Testing

- ✅ Write comprehensive tests
- ✅ Test both success and failure cases
- ✅ Test with different input values
- ✅ Verify encryption/decryption flows

### 3. Deployment

- ✅ Test on testnet first
- ✅ Verify contract on Etherscan
- ✅ Document deployment addresses
- ✅ Keep deployment scripts versioned

### 4. Security

- ✅ Review contract code before deployment
- ✅ Use multisig for admin functions (production)
- ✅ Audit contracts before mainnet
- ✅ Keep dependencies updated

---

## Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [Solidity Documentation](https://docs.soliditylang.org)
- [Zama FHEVM Documentation](https://docs.zama.org)
- [Hardhat Plugins](https://hardhat.org/plugins)

---

## Quick Reference

### Common Commands

```bash
# Compile
npm run compile

# Test
npm test

# Deploy to Sepolia
npm run deploy:sepolia

# Deploy locally
npm run deploy:local

# Hardhat console
npx hardhat console --network sepolia

# Clean artifacts
npx hardhat clean
```

### File Locations

- **Config**: `hardhat.config.ts`
- **Contracts**: `contracts/`
- **Scripts**: `scripts/`
- **Tests**: `test/`
- **Artifacts**: `artifacts/` (generated)
- **Cache**: `cache/` (generated)

---

**Last Updated**: December 2024  
**Version**: 1.0.0

