# Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE LAYER                               │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         React Frontend (Vite)                          │  │
│  │                                                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │  │
│  │  │  LoanForm    │  │ ResultPanel  │  │ Calculator   │                │  │
│  │  │              │  │              │  │              │                │  │
│  │  │ • Input UI   │  │ • Decrypt UI │  │ • Real-time  │                │  │
│  │  │ • Validation │  │ • Results    │  │   calc       │                │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                │  │
│  │         │                  │                  │                         │  │
│  │         └──────────────────┴──────────────────┘                         │  │
│  │                            │                                              │  │
│  │                    ┌───────▼────────┐                                    │  │
│  │                    │   App.tsx       │                                    │  │
│  │                    │  (Main Router) │                                    │  │
│  │                    └───────┬────────┘                                    │  │
│  └────────────────────────────┼────────────────────────────────────────────┘  │
│                               │                                                 │
│                    ┌──────────▼──────────┐                                     │
│                    │  FHEVM Integration │                                     │
│                    │   (fhevm.ts)       │                                     │
│                    │                     │                                     │
│                    │ • initFhevm()      │                                     │
│                    │ • encryptLoanInputs()                                    │
│                    │ • decryptApplication()                                    │
│                    └──────────┬──────────┘                                     │
└───────────────────────────────┼───────────────────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │  @zama-fhe/relayer-sdk│
                    │                       │
                    │ • createInstance()   │
                    │ • createEncryptedInput()                                  │
                    │ • userDecrypt()       │
                    └───────────┬───────────┘
                                │
                                │ Encrypted Data + Attestation
                                │
┌───────────────────────────────▼───────────────────────────────────────────────┐
│                        BLOCKCHAIN LAYER                                        │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                    Ethereum Sepolia Network                           │    │
│  │                                                                       │    │
│  │  ┌──────────────────────────────────────────────────────────────┐    │    │
│  │  │         ConfidentialLending.sol (Smart Contract)            │    │    │
│  │  │                                                              │    │    │
│  │  │  State Variables:                                           │    │    │
│  │  │  • admin: address                                           │    │    │
│  │  │  • minScoreForApproval: uint64                              │    │    │
│  │  │  • applications: mapping(address => LoanApplication)        │    │    │
│  │  │                                                              │    │    │
│  │  │  Functions:                                                  │    │    │
│  │  │  • applyForLoan() - Accepts encrypted inputs                │    │    │
│  │  │  • getMyApplication() - Returns encrypted results           │    │    │
│  │  │  • updateThreshold() - Admin function                       │    │    │
│  │  │                                                              │    │    │
│  │  │  FHE Operations:                                            │    │    │
│  │  │  • FHE.fromExternal() - Convert external to internal        │    │    │
│  │  │  • FHE.add/sub/mul() - Homomorphic arithmetic              │    │    │
│  │  │  • FHE.ge() - Encrypted comparison                          │    │    │
│  │  │  • FHE.select() - Conditional selection                    │    │    │
│  │  │  • FHE.allowForDecryption() - Grant decryption rights      │    │    │
│  │  └──────────────────────────────────────────────────────────────┘    │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────────────────┘
                                │
                                │ FHE Computation Requests
                                │
┌───────────────────────────────▼───────────────────────────────────────────────┐
│                        ZAMA FHEVM INFRASTRUCTURE                               │
│                                                                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │     Gateway       │  │       KMS        │  │   Coprocessor    │          │
│  │                   │  │                   │  │                  │          │
│  │ • Input handling │  │ • Key management │  │ • FHE operations │          │
│  │ • Attestation    │  │ • Public keys    │  │ • Homomorphic    │          │
│  │   validation     │  │ • Encryption     │  │   computation   │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                         Relayer                                       │    │
│  │                                                                       │    │
│  │  • Receives encrypted computation requests                           │    │
│  │  • Coordinates with Coprocessor for FHE operations                   │    │
│  │  • Returns encrypted results to contract                             │    │
│  │  • Handles user decryption requests                                  │    │
│  │  • Validates EIP-712 signatures                                      │    │
│  │  • Returns plaintext to authorized users                             │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Loan Application Flow

```
User Input (Plaintext)
    │
    ▼
Frontend Encryption (fhevm.ts)
    │
    ├─► Encrypted Income (euint64)
    ├─► Encrypted Repayment Score (euint16)
    ├─► Encrypted Debt (euint64)
    ├─► Encrypted Loan Amount (euint64)
    └─► Attestation (Zero-Knowledge Proof)
    │
    ▼
Smart Contract (applyForLoan)
    │
    ├─► Validates Attestation
    ├─► Converts External → Internal Handles
    │
    ▼
FHE Computation (On-Chain)
    │
    ├─► income × 2
    ├─► repaymentScore × 3
    ├─► Add: income×2 + repaymentScore×3
    ├─► Subtract: sum - debt
    ├─► Subtract: subtotal - loanAmount
    ├─► Compare: score >= threshold
    └─► Select: approved (1 or 0)
    │
    ▼
Storage (Encrypted)
    │
    ├─► applications[user].score (euint64)
    └─► applications[user].approved (euint8)
```

### 2. Decryption Flow

```
User Requests Decryption
    │
    ▼
Frontend (ResultPanel)
    │
    ├─► Fetches encrypted data from contract
    │
    ▼
FHEVM SDK (userDecrypt)
    │
    ├─► Prepares EIP-712 typed data
    ├─► Requests user signature (MetaMask)
    │
    ▼
Relayer
    │
    ├─► Validates signature
    ├─► Checks decryption permissions
    ├─► Decrypts using user's key
    │
    ▼
Frontend (Plaintext Results)
    │
    ├─► Risk Score: 255
    └─► Approved: false
```

## Component Interactions

### Frontend Components

```
App.tsx (Root)
    │
    ├─► Header (Wallet Connection)
    ├─► Navigation (Page Router)
    │
    ├─► Dashboard Page
    │   ├─► LoanForm (Apply for Loan)
    │   └─► ResultPanel (Check Status)
    │
    ├─► Calculator Page
    │   └─► Calculator Component
    │
    ├─► Status Page
    │   └─► ResultPanel
    │
    └─► TermDefinitions Modal
        └─► Financial Terms
```

### Smart Contract Structure

```
ConfidentialLending
    │
    ├─► State
    │   ├─► admin: address
    │   ├─► minScoreForApproval: uint64
    │   └─► applications: mapping
    │
    ├─► Functions
    │   ├─► applyForLoan() [public]
    │   ├─► getMyApplication() [view]
    │   └─► updateThreshold() [admin only]
    │
    └─► Events
        └─► LoanApplied(address)
```

## Security Architecture

### Encryption Layers

1. **Client-Side Encryption**
   - Data encrypted before leaving browser
   - Uses FHEVM SDK encryption
   - Zero-knowledge proofs generated

2. **On-Chain Storage**
   - All data stored as encrypted types (euint*)
   - No plaintext on blockchain
   - Decryption keys never stored on-chain

3. **Decryption Control**
   - User-controlled via cryptographic signatures
   - Relayer validates permissions
   - Only authorized users can decrypt

### Privacy Guarantees

✅ **Input Privacy**: Financial data encrypted before submission  
✅ **Computation Privacy**: Risk scores calculated on encrypted data  
✅ **Storage Privacy**: All results stored encrypted  
✅ **Decryption Privacy**: Only borrower can decrypt their results  
✅ **Zero-Knowledge**: Attestations prove validity without revealing values  

## Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Web3**: ethers.js v6
- **FHE**: @zama-fhe/relayer-sdk

### Smart Contracts
- **Language**: Solidity ^0.8.24
- **FHE Library**: @fhevm/solidity
- **Development**: Hardhat
- **Testing**: Hardhat + ethers.js

### Infrastructure
- **Blockchain**: Ethereum Sepolia (testnet)
- **FHEVM**: Zama FHEVM Protocol
- **Relayer**: Zama Public Relayer (testnet)
- **Gateway**: Zama Gateway (testnet)
- **KMS**: Zama Key Management System

## Network Configuration

### Sepolia Testnet
- **Chain ID**: 11155111
- **RPC URL**: `https://rpc.sepolia.org` (or Alchemy/Infura)
- **Relayer**: `https://relayer.testnet.zama.org`
- **Gateway**: `https://gateway.testnet.zama.org`

### Contract Addresses (Example)
- **ConfidentialLending**: `0xb47052aA34DfCbADa54F2BBFEEBa66172C45E937`

---

**Last Updated**: December 2024  
**Version**: 1.0.0

