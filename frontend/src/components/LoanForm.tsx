import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { encryptLoanInputs } from '../lib/fhevm';
import { mockEncryptLoanInputs, storeMockApplication } from '../lib/fhevm-mock';
import ConfidentialLendingABI from '../abis/ConfidentialLending.json';

const USE_MOCK_MODE = import.meta.env.VITE_USE_MOCK_MODE === 'true'; // Set VITE_USE_MOCK_MODE=true in .env to enable demo mode
const MIN_SCORE_FOR_APPROVAL = 1000;

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
  const [calculatedScore, setCalculatedScore] = useState<number | null>(null);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);

  // Auto-calculate risk score as user types
  useEffect(() => {
    if (income && repaymentScore && debt && loanAmount) {
      const incomeNum = parseInt(income) || 0;
      const scoreNum = parseInt(repaymentScore) || 0;
      const debtNum = parseInt(debt) || 0;
      const loanNum = parseInt(loanAmount) || 0;

      // Risk Score Formula: (Income × 2) + (Repayment Score × 3) - Debt - Loan Amount
      const score = (incomeNum * 2) + (scoreNum * 3) - debtNum - loanNum;
      setCalculatedScore(score);
      setIsEligible(score >= MIN_SCORE_FOR_APPROVAL);
    } else {
      setCalculatedScore(null);
      setIsEligible(null);
    }
  }, [income, repaymentScore, debt, loanAmount]);

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
        // Real mode with auto-fallback
        try {
          const result = await encryptLoanInputs(contractAddress, userAddress, loanValues, true);
          inputs = result.inputs;
          attestation = result.attestation;
          
          // If auto-fallback occurred, store for mock decryption
          if (result.isMock) {
            console.log('🔄 Auto-fallback to mock mode was used for encryption');
            storeMockApplication(loanValues);
          }
        } catch (encryptError: any) {
          const errorMsg = encryptError?.message || 'Unknown error';
          // Only show error if it's not a fallback case (fallback should have succeeded)
          if (!errorMsg.includes('FALLBACK') && !errorMsg.toLowerCase().includes('whitelist')) {
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
    <div className="rounded-xl border border-[var(--border-gold)] bg-[var(--bg-card)] shadow-[0_0_15px_var(--accent-gold-glow)] hover:bg-[var(--bg-card-hover)] transition-all duration-300 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--text-gold)] tracking-wide mb-2">Apply for a Confidential Loan</h2>
        <p className="text-[var(--text-muted)] text-sm">
          🔒 All your financial data is encrypted before being sent on-chain. Only you can decrypt your risk score and approval status.
        </p>
      </div>

      {/* Auto-calculated Risk Score Display */}
      {calculatedScore !== null && (
        <div className={`mb-4 p-4 rounded-xl border border-[var(--border-gold)] bg-[var(--bg-card)] shadow-[0_0_10px_var(--accent-gold-glow)] ${
          isEligible 
            ? '' 
            : 'border-red-500/50'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[var(--text-muted)] mb-1">Estimated Risk Score</div>
              <div className={`text-2xl font-mono font-bold ${isEligible ? 'text-[var(--text-gold)]' : 'text-red-400'}`}>
                {calculatedScore}
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-semibold ${isEligible ? 'text-[var(--text-gold)]' : 'text-red-400'}`}>
                {isEligible ? '✓ Likely Approved' : '✗ Likely Rejected'}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">
                Min: {MIN_SCORE_FOR_APPROVAL}
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-gold)] mb-1">
            Monthly Income ($)
            <span className="ml-2 text-xs text-[var(--text-muted)] font-normal">Total monthly income from all sources</span>
          </label>
          <input
            type="number"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            required
            min="0"
            className="w-full bg-[#0a0a0a] border border-[var(--border-gold)] text-[var(--text-light)] placeholder-[var(--text-muted)] rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[var(--border-gold)] transition-all"
            placeholder="e.g., 5000"
          />
          <p className="text-xs text-[var(--text-muted)] mt-1">💡 Recommended: $3,000+ for better approval chances</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-gold)] mb-1">
            Repayment Score (0-100)
            <span className="ml-2 text-xs text-[var(--text-muted)] font-normal">Credit/repayment history score</span>
          </label>
          <input
            type="number"
            value={repaymentScore}
            onChange={(e) => setRepaymentScore(e.target.value)}
            required
            min="0"
            max="100"
            className="w-full bg-[#0a0a0a] border border-[var(--border-gold)] text-[var(--text-light)] placeholder-[var(--text-muted)] rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[var(--border-gold)] transition-all"
            placeholder="e.g., 75"
          />
          <p className="text-xs text-[var(--text-muted)] mt-1">💡 Recommended: 70+ for better approval chances</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-gold)] mb-1">
            Outstanding Debt ($)
            <span className="ml-2 text-xs text-[var(--text-muted)] font-normal">Total current debt obligations</span>
          </label>
          <input
            type="number"
            value={debt}
            onChange={(e) => setDebt(e.target.value)}
            required
            min="0"
            className="w-full bg-[#0a0a0a] border border-[var(--border-gold)] text-[var(--text-light)] placeholder-[var(--text-muted)] rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[var(--border-gold)] transition-all"
            placeholder="e.g., 1000"
          />
          <p className="text-xs text-[var(--text-muted)] mt-1">💡 Lower debt improves your risk score</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-gold)] mb-1">
            Requested Loan Amount ($)
            <span className="ml-2 text-xs text-[var(--text-muted)] font-normal">Amount you want to borrow</span>
          </label>
          <input
            type="number"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
            required
            min="0"
            className="w-full bg-[#0a0a0a] border border-[var(--border-gold)] text-[var(--text-light)] placeholder-[var(--text-muted)] rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[var(--border-gold)] transition-all"
            placeholder="e.g., 2000"
          />
          <p className="text-xs text-[var(--text-muted)] mt-1">💡 Smaller loans have better approval rates</p>
        </div>

        {error && (
          <div className="bg-black/60 border-2 border-red-500/50 text-red-200 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm">
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
          <div className="bg-black/60 border-2 border-gold-500/50 text-gold-200 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gold-400"></div>
              <span className="font-medium">{step}</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--border-gold)] text-black font-semibold rounded-lg px-5 py-3 shadow-[0_0_10px_var(--accent-gold-glow)] hover:brightness-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
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

