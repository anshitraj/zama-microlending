import { useState } from 'react';
import { ethers } from 'ethers';
import { encryptLoanInputs } from '../lib/fhevm';
import { mockEncryptLoanInputs, storeMockApplication } from '../lib/fhevm-mock';
import ConfidentialLendingABI from '../abis/ConfidentialLending.json';

const USE_MOCK_MODE = import.meta.env.VITE_USE_MOCK_MODE === 'true'; // Set VITE_USE_MOCK_MODE=true in .env to enable demo mode

interface LoanFormProps {
  contractAddress: string;
  signer: ethers.JsonRpcSigner | null;
  onSuccess: () => void;
}

export default function LoanForm({ contractAddress, signer, onSuccess }: LoanFormProps) {
  const [income, setIncome] = useState('');
  const [repaymentScore, setRepaymentScore] = useState('');
  const [debt, setDebt] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer) {
      setError('Please connect your wallet');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('Encrypting inputs...');

    try {
      const userAddress = await signer.getAddress();
      
      const loanValues = {
        income: parseInt(income),
        repaymentScore: parseInt(repaymentScore),
        debt: parseInt(debt),
        loanAmount: parseInt(loanAmount),
      };

      // Encrypt inputs
      setStep('Encrypting your loan application data...');
      let inputs, attestation;
      
      if (USE_MOCK_MODE) {
        // Mock mode - simulate encryption
        console.log('🎭 [DEMO MODE] Using mock encryption');
        try {
          const result = await mockEncryptLoanInputs(contractAddress, userAddress, loanValues);
          inputs = result.inputs;
          attestation = result.attestation;
          // Store for mock decryption
          storeMockApplication(loanValues);
        } catch (encryptError: any) {
          setError(`Mock encryption failed: ${encryptError?.message}`);
          setLoading(false);
          setStep('');
          return;
        }
      } else {
        // Real mode
        try {
          const result = await encryptLoanInputs(contractAddress, userAddress, loanValues);
          inputs = result.inputs;
          attestation = result.attestation;
        } catch (encryptError: any) {
          const errorMsg = encryptError?.message || 'Unknown error';
          if (errorMsg.includes('CORS') || errorMsg.includes('Cross-Origin')) {
            setError('🚫 CORS Error: The relayer is blocking browser requests. Solutions: 1) Install CORS extension, 2) Use local relayer (Docker). See RELAYER_CORS_FIX.md');
          } else if (errorMsg.includes('FHEVM') || errorMsg.includes('null') || errorMsg.includes('instance')) {
            setError('❌ FHEVM not initialized. The relayer connection failed. Check console for details or use a local relayer.');
          } else if (errorMsg.includes('Relayer Connection')) {
            setError('🔌 Relayer Connection Failed. The service may be temporarily unavailable. Try again or use a local relayer.');
          } else {
            setError(`Encryption failed: ${errorMsg}`);
          }
          setLoading(false);
          setStep('');
          return;
        }
      }

      // Submit transaction
      setStep('Submitting encrypted loan application...');
      
      if (USE_MOCK_MODE) {
        // Mock transaction - just simulate delay
        console.log('🎭 [DEMO MODE] Simulating transaction submission');
        await new Promise(resolve => setTimeout(resolve, 2000));
        setStep('Transaction confirmed!');
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        // Real transaction
        const contract = new ethers.Contract(contractAddress, ConfidentialLendingABI, signer);
        const tx = await contract.applyForLoan(
          inputs[0], // extIncome
          inputs[1], // extRepaymentScore
          inputs[2], // extDebt
          inputs[3], // extLoanAmount
          attestation
        );

        setStep('Waiting for transaction confirmation...');
        await tx.wait();
      }

      setStep('Loan application submitted successfully!');
      onSuccess();
      
      // Reset form
      setIncome('');
      setRepaymentScore('');
      setDebt('');
      setLoanAmount('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit loan application');
      console.error(err);
    } finally {
      setLoading(false);
      setStep('');
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-blue-900/30 rounded-xl shadow-2xl p-6 border-2 border-blue-500/30 backdrop-blur-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 text-gray-100">Apply for a Confidential Loan</h2>
        <p className="text-gray-300 text-sm">
          🔒 All your financial data is encrypted before being sent on-chain. Only you can decrypt your risk score and approval status.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Monthly Income
          </label>
          <input
            type="number"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            required
            min="0"
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-100 placeholder-gray-500"
            placeholder="e.g., 5000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Repayment Score (0-100)
          </label>
          <input
            type="number"
            value={repaymentScore}
            onChange={(e) => setRepaymentScore(e.target.value)}
            required
            min="0"
            max="100"
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-100 placeholder-gray-500"
            placeholder="e.g., 75"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Outstanding Debt
          </label>
          <input
            type="number"
            value={debt}
            onChange={(e) => setDebt(e.target.value)}
            required
            min="0"
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-100 placeholder-gray-500"
            placeholder="e.g., 1000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Requested Loan Amount
          </label>
          <input
            type="number"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
            required
            min="0"
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-100 placeholder-gray-500"
            placeholder="e.g., 2000"
          />
        </div>

        {error && (
          <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 border-2 border-red-500/50 text-red-200 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm">
            <div className="flex items-start gap-2">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold mb-1 text-red-300">Error</p>
                <p className="text-sm text-red-200/80">{error}</p>
              </div>
            </div>
          </div>
        )}

        {step && (
          <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-2 border-blue-500/50 text-blue-200 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              <span className="font-medium">{step}</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg shadow-blue-500/50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing...
            </span>
          ) : (
            '🔒 Submit Encrypted Loan Application'
          )}
        </button>
      </form>
    </div>
  );
}

