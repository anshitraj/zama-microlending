// Mock FHEVM implementation for demo purposes
// This simulates the encryption/decryption flow without requiring the actual relayer

import { ethers } from 'ethers';

// Mock encrypted data structure
interface MockEncryptedData {
  inputs: string[];
  attestation: string;
}

// Simulate encryption delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock encryption function
export async function mockEncryptLoanInputs(
  contractAddress: string,
  userAddress: string,
  values: { income: number; repaymentScore: number; debt: number; loanAmount: number }
): Promise<MockEncryptedData> {
  console.log('🔒 [MOCK] Starting encryption...', { values, contractAddress, userAddress });
  
  // Simulate encryption delay
  await delay(1500);
  
  // Generate mock encrypted inputs (simulating FHE encryption)
  const mockInputs = [
    `0x${Buffer.from(`enc_income_${values.income}`).toString('hex').padEnd(64, '0')}`,
    `0x${Buffer.from(`enc_score_${values.repaymentScore}`).toString('hex').padEnd(64, '0')}`,
    `0x${Buffer.from(`enc_debt_${values.debt}`).toString('hex').padEnd(64, '0')}`,
    `0x${Buffer.from(`enc_loan_${values.loanAmount}`).toString('hex').padEnd(64, '0')}`,
  ];
  
  const mockAttestation = `0x${Buffer.from(`attestation_${Date.now()}`).toString('hex').padEnd(128, '0')}`;
  
  console.log('✅ [MOCK] Encryption successful!', {
    inputCount: mockInputs.length,
    attestationLength: mockAttestation.length,
  });
  
  return { inputs: mockInputs, attestation: mockAttestation };
}

// Mock decryption function
export async function mockDecryptApplication(
  contract: ethers.Contract,
  signer: ethers.JsonRpcSigner
): Promise<{ score: number; approved: number }> {
  console.log('🔓 [MOCK] Starting decryption process...');
  
  // Simulate decryption delay
  await delay(2000);
  
  // Get the last submitted values from localStorage (simulating on-chain data)
  const storedData = localStorage.getItem('mockLoanApplication');
  if (!storedData) {
    throw new Error('No loan application found. Please submit a loan application first.');
  }
  
  const { income, repaymentScore, debt, loanAmount } = JSON.parse(storedData);
  
  // Calculate risk score: (Income × 2) + (Repayment Score × 3) - Debt - Loan Amount
  const score = (income * 2) + (repaymentScore * 3) - debt - loanAmount;
  
  // Approval threshold: score >= 0
  const approved = score >= 0 ? 1 : 0;
  
  console.log('🎉 [MOCK] Decryption successful!', {
    score,
    approved: approved === 1 ? 'APPROVED' : 'REJECTED',
    calculation: `(${income} × 2) + (${repaymentScore} × 3) - ${debt} - ${loanAmount} = ${score}`,
  });
  
  return { score, approved };
}

// Mock FHEVM initialization (always succeeds)
export async function mockInitFhevm(): Promise<any> {
  console.log('🔐 [MOCK] Initializing FHEVM...');
  await delay(500);
  console.log('✅ [MOCK] FHEVM initialized successfully');
  return { mock: true };
}

// Store mock application data
export function storeMockApplication(values: {
  income: number;
  repaymentScore: number;
  debt: number;
  loanAmount: number;
}) {
  localStorage.setItem('mockLoanApplication', JSON.stringify(values));
  console.log('💾 [MOCK] Application data stored:', values);
}

