# Zama FHEVM Integration Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [FHEVM Features Used](#fhevm-features-used)
4. [Contract-by-Contract Breakdown](#contract-by-contract-breakdown)
5. [Frontend Integration Flow](#frontend-integration-flow)
6. [Complete User Journeys](#complete-user-journeys)
7. [Encryption Flow Diagrams](#encryption-flow-diagrams)

---

## Overview

The **Confidential Micro-Lending Engine** leverages Zama's FHEVM (Fully Homomorphic Encryption Virtual Machine) to provide complete privacy for borrower financial data while maintaining a fair and transparent lending decision system.

### Core Privacy Features

✅ **Private Financial Data** - Income, debt, and loan amounts are encrypted and never revealed publicly  
✅ **Private Risk Scores** - Risk calculations happen on encrypted data, scores remain encrypted until user decrypts  
✅ **Private Approval Status** - Loan approval/rejection decisions are encrypted until decryption  
✅ **Private Balances** - All financial calculations remain encrypted within the contract  
✅ **Fair Lending Decisions** - Decryption only happens after computation, ensuring fair evaluation  
✅ **User-Controlled Decryption** - Only the borrower can decrypt their own results using cryptographic signatures  

### How It Works

1. **Client-Side Encryption**: Borrower inputs (income, repayment score, debt, loan amount) are encrypted in the browser using FHEVM SDK before leaving the device
2. **On-Chain Confidential Computation**: The smart contract performs risk score calculations entirely on encrypted data using homomorphic operations
3. **User-Controlled Decryption**: Only the borrower can decrypt their risk score and approval status using their cryptographic signature via the relayer

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  fhevmjs / @zama-fhe/relayer-sdk                         │  │
│  │  • Client-side encryption                                 │  │
│  │  • Key generation                                         │  │
│  │  • Input encryption (income, score, debt, loanAmount)    │  │
│  │  • Zero-knowledge proof creation                          │  │
│  │  • User decryption with EIP-712 signatures               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Components:                                                     │
│  • LoanForm.tsx - Encrypts and submits loan application         │
│  • ResultPanel.tsx - Decrypts and displays loan status          │
│  • Calculator.tsx - Real-time risk score calculation           │
│  • Navigation.tsx - App navigation                              │
│  • TermDefinitions.tsx - Financial term definitions            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Encrypted Data + Attestation
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              SMART CONTRACTS (Solidity + FHEVM)                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ConfidentialLending.sol                                  │  │
│  │  • Encrypted operations (FHE.add, FHE.sub, FHE.mul)      │  │
│  │  • FHE computation (risk score calculation)               │  │
│  │  • Encrypted comparisons (FHE.ge)                         │  │
│  │  • Encrypted conditional selection (FHE.select)           │  │
│  │  • Decryption rights management (FHE.allowForDecryption)   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Functions:                                                     │
│  • applyForLoan() - Accepts encrypted inputs, computes score     │
│  • getMyApplication() - Returns encrypted score and approval    │
│  • updateThreshold() - Admin function to update min score      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Encrypted Results
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ZAMA INFRASTRUCTURE                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Gateway                                                  │  │
│  │  • Handles encrypted inputs                              │  │
│  │  • Validates attestations                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  KMS (Key Management System)                             │  │
│  │  • Manages encryption keys                               │  │
│  │  • Provides public keys for encryption                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Coprocessor                                             │  │
│  │  • Performs FHE computations                             │  │
│  │  • Executes homomorphic operations                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Relayer                                                  │  │
│  │  • Returns decrypted results via callbacks               │  │
│  │  • Handles user decryption requests                      │  │
│  │  • Validates EIP-712 signatures                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## FHEVM Features Used

### Encrypted Data Types

- **`euint64`**: Encrypted 64-bit unsigned integers (for income, debt, loan amount, risk score)
- **`euint16`**: Encrypted 16-bit unsigned integers (for repayment score 0-100)
- **`euint8`**: Encrypted 8-bit unsigned integers (for approval flag: 0 or 1)
- **`ebool`**: Encrypted boolean values (for comparison results)
- **`externalEuint*`**: External encrypted types for function parameters

### FHE Operations

1. **`FHE.fromExternal()`**: Converts external encrypted inputs to internal encrypted handles
2. **`FHE.add()`**: Homomorphic addition of encrypted values
3. **`FHE.sub()`**: Homomorphic subtraction of encrypted values
4. **`FHE.mul()`**: Homomorphic multiplication (encrypted × plaintext)
5. **`FHE.asEuint64()`**: Type conversion to encrypted uint64
6. **`FHE.asEuint8()`**: Type conversion to encrypted uint8
7. **`FHE.ge()`**: Greater-than-or-equal comparison (returns encrypted boolean)
8. **`FHE.select()`**: Conditional selection based on encrypted boolean
9. **`FHE.allowForDecryption()`**: Grants decryption rights to specific addresses

### Risk Score Formula

The risk score is calculated entirely on encrypted data:

```
score = (income × 2) + (repaymentScore × 3) - debt - loanAmount
```

If `score >= minScoreForApproval` (default: 1000), the loan is approved.

---

## Contract-by-Contract Breakdown

### ConfidentialLending.sol

**Purpose**: Main lending contract that processes encrypted loan applications and computes confidential risk scores.

**State Variables**:
- `admin`: Address of the contract administrator
- `minScoreForApproval`: Minimum risk score threshold for loan approval (default: 1000)
- `applications`: Mapping from borrower address to `LoanApplication` struct

**Structs**:
```solidity
struct LoanApplication {
    euint64 score;      // Encrypted risk score
    euint8  approved;   // Encrypted approval flag (1 = approved, 0 = rejected)
    bool    exists;     // Whether application exists
}
```

**Functions**:

1. **`applyForLoan()`**
   - **Inputs**: Encrypted income, repayment score, debt, loan amount, and attestation
   - **Process**:
     - Converts external encrypted inputs to internal handles
     - Computes risk score: `(income × 2) + (repaymentScore × 3) - debt - loanAmount`
     - Compares score against threshold using `FHE.ge()`
     - Selects approval flag (1 or 0) using `FHE.select()`
     - Stores encrypted results
     - Grants decryption rights to borrower
   - **Emits**: `LoanApplied` event

2. **`getMyApplication()`**
   - **Returns**: Encrypted risk score and approval flag for the caller
   - **Access**: Only the borrower who submitted the application

3. **`updateThreshold()`**
   - **Inputs**: New minimum score threshold
   - **Access**: Admin only
   - **Purpose**: Allows updating the minimum score required for approval

---

## Frontend Integration Flow

### 1. FHEVM Initialization

```typescript
// frontend/src/lib/fhevm.ts
import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/web';

async function initFhevm(): Promise<FhevmInstance> {
  const config = {
    ...SepoliaConfig,
    relayerUrl: 'https://relayer.testnet.zama.org',
    provider: window.ethereum,  // EIP1193 provider
    rpcUrl: import.meta.env.VITE_RPC_URL
  };
  
  return await createInstance(config);
}
```

**Key Points**:
- Uses Zama's public relayer on Sepolia testnet
- Requires `window.ethereum` (MetaMask) or RPC URL
- Initializes encryption/decryption capabilities

### 2. Loan Application Encryption

```typescript
// frontend/src/lib/fhevm.ts
export async function encryptLoanInputs(
  contractAddress: string,
  userAddress: string,
  values: { income, repaymentScore, debt, loanAmount }
) {
  const fhe = await initFhevm();
  const enc = await fhe.createEncryptedInput(contractAddress, userAddress);
  
  enc.add64(values.income);
  enc.add16(values.repaymentScore);
  enc.add64(values.debt);
  enc.add64(values.loanAmount);
  
  const result = await enc.encrypt();
  return {
    inputs: result.inputs,        // Encrypted handles
    attestation: result.attestation  // Zero-knowledge proof
  };
}
```

**Flow**:
1. Create encrypted input builder
2. Add each value with appropriate bit size (64, 16, 64, 64)
3. Encrypt all inputs together
4. Receive encrypted handles and attestation

### 3. On-Chain Submission

```typescript
// frontend/src/components/LoanForm.tsx
const contract = new ethers.Contract(
  contractAddress,
  ConfidentialLendingABI,
  signer
);

await contract.applyForLoan(
  inputs[0],  // extIncome
  inputs[1],  // extRepaymentScore
  inputs[2],  // extDebt
  inputs[3],  // extLoanAmount
  attestation
);
```

**What Happens**:
- Encrypted data is sent to the contract
- Contract validates attestation
- Contract performs homomorphic computation
- Encrypted results are stored

### 4. Result Decryption

```typescript
// frontend/src/lib/fhevm.ts
export async function decryptApplication(
  contract: ethers.Contract,
  signer: ethers.JsonRpcSigner
) {
  const fhe = await initFhevm();
  
  // Fetch encrypted results from contract
  const [encryptedScore, encryptedApproved] = await contract.getMyApplication();
  
  // Prepare EIP-712 typed data for decryption
  const chainId = (await provider.getNetwork()).chainId;
  const publicKey = await fhe.getPublicKey();
  const signature = await signer.signTypedData(...);
  
  // Request decryption from relayer
  const decrypted = await fhe.userDecrypt(
    encryptedScore,
    encryptedApproved,
    publicKey,
    signature,
    contractAddress,
    userAddress
  );
  
  return {
    score: decrypted[0],
    approved: decrypted[1] === 1
  };
}
```

**Flow**:
1. Fetch encrypted results from contract
2. Prepare EIP-712 typed data
3. User signs the typed data (MetaMask popup)
4. Send signature to relayer
5. Relayer validates signature and returns decrypted values

---

## Complete User Journeys

### Journey 1: Successful Loan Application

1. **User opens application** → Connects MetaMask wallet
2. **FHEVM initializes** → SDK connects to Zama relayer
3. **User fills loan form**:
   - Monthly Income: $5,000
   - Repayment Score: 85
   - Outstanding Debt: $2,000
   - Loan Amount: $10,000
4. **User clicks "Apply Securely"**:
   - Frontend encrypts all inputs
   - Transaction is prepared
   - User approves transaction in MetaMask
   - Encrypted data is sent on-chain
5. **Contract processes**:
   - Validates attestation
   - Computes: `(5000×2) + (85×3) - 2000 - 10000 = 255`
   - Compares: `255 >= 1000` → `false`
   - Sets approval flag to `0` (rejected)
   - Stores encrypted results
6. **User clicks "Decrypt My Status"**:
   - Frontend fetches encrypted results
   - User signs EIP-712 message
   - Relayer decrypts and returns:
     - Score: 255
     - Approved: false
7. **User sees result**: "Loan Rejected - Risk Score: 255 (Minimum: 1000)"

### Journey 2: Approved Loan Application

1. **User applies with better financials**:
   - Income: $8,000
   - Repayment Score: 95
   - Debt: $1,000
   - Loan Amount: $5,000
2. **Contract computes**: `(8000×2) + (95×3) - 1000 - 5000 = 10,085`
3. **Contract compares**: `10,085 >= 1000` → `true`
4. **Contract sets approval flag to `1` (approved)**
5. **User decrypts**: Sees "Loan Approved - Risk Score: 10,085"

### Journey 3: Mock Mode (Demo)

1. **User enables mock mode** in `.env`: `VITE_USE_MOCK_MODE=true`
2. **No wallet needed** → App uses simulated encryption/decryption
3. **All operations work** → Perfect for demos and testing
4. **Data is stored locally** → No blockchain interaction

---

## Encryption Flow Diagrams

### Complete Encryption Flow

```
┌─────────────┐
│   Browser   │
│  (React)    │
└──────┬──────┘
       │
       │ 1. User Inputs
       │    (income, score, debt, loanAmount)
       ▼
┌─────────────────────────────────────┐
│  FHEVM SDK (createEncryptedInput)    │
│  • Generates encryption keys        │
│  • Encrypts each input              │
│  • Creates zero-knowledge proof     │
└──────┬──────────────────────────────┘
       │
       │ 2. Encrypted Handles + Attestation
       ▼
┌─────────────────────────────────────┐
│  Smart Contract (applyForLoan)      │
│  • Validates attestation            │
│  • Converts external → internal     │
│  • Performs FHE computation         │
│  • Stores encrypted results         │
└──────┬──────────────────────────────┘
       │
       │ 3. Encrypted Score & Approval
       ▼
┌─────────────────────────────────────┐
│  Contract Storage                   │
│  • applications[user].score         │
│  • applications[user].approved     │
└─────────────────────────────────────┘
```

### Decryption Flow

```
┌─────────────┐
│   Browser   │
│  (React)    │
└──────┬──────┘
       │
       │ 1. User clicks "Decrypt"
       ▼
┌─────────────────────────────────────┐
│  Contract (getMyApplication)        │
│  • Returns encrypted score         │
│  • Returns encrypted approval       │
└──────┬──────────────────────────────┘
       │
       │ 2. Encrypted Data
       ▼
┌─────────────────────────────────────┐
│  FHEVM SDK (userDecrypt)            │
│  • Prepares EIP-712 typed data      │
│  • User signs (MetaMask)             │
│  • Sends to relayer                 │
└──────┬──────────────────────────────┘
       │
       │ 3. Signature + Encrypted Data
       ▼
┌─────────────────────────────────────┐
│  Zama Relayer                        │
│  • Validates signature               │
│  • Decrypts using user's key        │
│  • Returns plaintext                 │
└──────┬──────────────────────────────┘
       │
       │ 4. Decrypted Results
       ▼
┌─────────────────────────────────────┐
│  Browser Display                     │
│  • Risk Score: 255                   │
│  • Status: Rejected                  │
└─────────────────────────────────────┘
```

### Risk Score Computation (On-Chain)

```
Encrypted Inputs:
  income (euint64)
  repaymentScore (euint16)
  debt (euint64)
  loanAmount (euint64)
         │
         ▼
┌────────────────────────┐
│ FHE.mul(income, 2)     │ → incomeTimes2 (euint64)
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ FHE.asEuint64(score)   │ → repayment64 (euint64)
│ FHE.mul(repayment64, 3)│ → repaymentTimes3 (euint64)
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ FHE.add(incomeTimes2,  │
│        repaymentTimes3)│ → sum (euint64)
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ FHE.sub(sum, debt)     │ → subtotal (euint64)
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ FHE.sub(subtotal,      │
│        loanAmount)     │ → score (euint64)
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ FHE.ge(score, threshold)│ → isApproved (ebool)
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ FHE.select(isApproved, │
│        1, 0)            │ → approvedFlag (euint8)
└────────────────────────┘
```

---

## Security Considerations

### Privacy Guarantees

1. **No Plaintext on Blockchain**: All sensitive data remains encrypted on-chain
2. **User-Controlled Decryption**: Only the borrower can decrypt their results
3. **Zero-Knowledge Proofs**: Attestations prove data validity without revealing values
4. **Relayer Trust**: Relayer cannot decrypt without user's cryptographic signature

### Best Practices

1. **Always use `FHE.allowForDecryption()`**: Grants decryption rights explicitly
2. **Validate attestations**: Contract must verify zero-knowledge proofs
3. **Secure key management**: Never expose private keys or encryption keys
4. **Network verification**: Ensure users are on the correct network (Sepolia)

---

## Troubleshooting

### Common Issues

1. **FHEVM Not Initializing**
   - Check `window.ethereum` is available (MetaMask installed)
   - Verify RPC URL in `.env`
   - Check relayer URL is correct (`.org` not `.cloud`)

2. **Encryption Fails**
   - Ensure contract address is whitelisted (if required)
   - Check network is Sepolia
   - Verify all inputs are valid numbers

3. **Decryption Fails**
   - User must have submitted an application
   - Signature must be valid
   - Relayer must be accessible

4. **Transaction Fails**
   - Check gas limits
   - Verify contract is deployed
   - Ensure attestation is valid

---

## Resources

- [Zama FHEVM Documentation](https://docs.zama.org)
- [Relayer SDK Guide](https://docs.zama.org/fhevm/relayer-sdk)
- [Solidity FHE Library](https://docs.zama.org/fhevm/solidity-library)
- [GitHub Repository](https://github.com/anshitraj/zama-microlending)

---

**Last Updated**: December 2024  
**Version**: 1.0.0

