import { useState } from 'react';
import { ethers } from 'ethers';
import { decryptApplication } from '../lib/fhevm';
import { mockDecryptApplication } from '../lib/fhevm-mock';
import ConfidentialLendingABI from '../abis/ConfidentialLending.json';

const USE_MOCK_MODE = import.meta.env.VITE_USE_MOCK_MODE === 'true'; // Set VITE_USE_MOCK_MODE=true in .env to enable demo mode

interface ResultPanelProps {
  contractAddress: string;
  signer: ethers.JsonRpcSigner | null;
}

export default function ResultPanel({ contractAddress, signer }: ResultPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; approved: number } | null>(null);
  const [step, setStep] = useState<string>('');

  const handleDecrypt = async () => {
    if (!signer) {
      setError('Please connect your wallet');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setStep('Fetching your encrypted application...');

    try {
      if (USE_MOCK_MODE) {
        // Mock mode - simulate decryption
        console.log('🎭 [DEMO MODE] Using mock decryption');
        setStep('Preparing decryption request...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const contract = new ethers.Contract(contractAddress, ConfidentialLendingABI, signer);
        const { score, approved } = await mockDecryptApplication(contract, signer);
        
        setResult({ score, approved });
        setStep('Decryption successful!');
      } else {
        // Real mode
        const contract = new ethers.Contract(contractAddress, ConfidentialLendingABI, signer);
        
        setStep('Preparing decryption request...');
        const { score, approved } = await decryptApplication(contract, signer);

        setResult({ score, approved });
        setStep('Decryption successful!');
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to decrypt application';
      if (errorMsg.includes('CORS') || errorMsg.includes('Cross-Origin')) {
        setError('🚫 CORS Error: Relayer is blocking browser requests. Install CORS extension or use local relayer.');
      } else if (errorMsg.includes('FHEVM') || errorMsg.includes('null') || errorMsg.includes('instance')) {
        setError('❌ FHEVM not initialized. Relayer connection failed. Check console or use local relayer.');
      } else if (errorMsg.includes('Relayer Connection') || errorMsg.includes('Bad JSON')) {
        setError('🔌 Relayer Connection Failed. Service may be unavailable. Try again or use local relayer.');
      } else {
        setError(errorMsg);
      }
      console.error('Decryption error:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setStep(''), 2000);
    }
  };

  return (
    <div className="bg-black/80 rounded-xl shadow-2xl p-6 border-2 border-gold-500/30 backdrop-blur-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 text-gold-300">Your Loan Application Status</h2>
        <p className="text-gray-300 text-sm">
          🔓 Decrypt your confidential risk score and approval status. Only you can see this information.
        </p>
      </div>

      {error && (
        <div className="bg-black/60 border-2 border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-start gap-2">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold mb-1 text-red-300">Decryption Error</p>
              <p className="text-sm text-red-200/80">{error}</p>
            </div>
          </div>
        </div>
      )}

      {step && (
        <div className="bg-black/60 border-2 border-gold-500/50 text-gold-200 px-4 py-3 rounded-lg mb-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gold-400"></div>
            <span className="font-medium">{step}</span>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4 mb-4">
          <div className="bg-black/60 rounded-xl p-6 border-2 border-gold-500/30 shadow-lg backdrop-blur-sm">
            <div className="text-sm font-semibold text-gold-400 mb-2 uppercase tracking-wide">Risk Score</div>
            <div className="text-5xl font-bold text-gold-300 mb-2">{result.score}</div>
            <div className="text-xs text-gray-400 bg-black/50 px-3 py-2 rounded-lg border border-gold-500/20">
              Formula: (Income × 2) + (Repayment Score × 3) - Debt - Loan Amount
            </div>
          </div>

          <div className={`rounded-xl p-6 border-2 shadow-lg transform transition-transform backdrop-blur-sm ${
            result.approved === 1 
              ? 'bg-black/60 border-gold-500/50' 
              : 'bg-black/60 border-red-500/50'
          }`}>
            <div className="text-sm font-semibold text-gold-400 mb-2 uppercase tracking-wide">Status</div>
            <div className={`text-4xl font-bold mb-2 ${result.approved === 1 ? 'text-gold-400' : 'text-red-400'}`}>
              {result.approved === 1 ? '✓ Approved' : '✗ Rejected'}
            </div>
            {result.approved === 0 && (
              <div className="text-sm text-gray-300 mt-2 bg-black/50 px-3 py-2 rounded-lg border border-red-500/30">
                Your risk score is below the minimum threshold for approval.
              </div>
            )}
            {result.approved === 1 && (
              <div className="text-sm text-gold-300 mt-2 bg-black/50 px-3 py-2 rounded-lg font-medium border border-gold-500/30">
                🎉 Congratulations! Your loan application has been approved.
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleDecrypt}
        disabled={loading}
        className="w-full bg-gradient-to-r from-gold-600 to-gold-500 text-black py-3 px-4 rounded-lg font-semibold hover:from-gold-500 hover:to-gold-400 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg shadow-gold-500/50"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Decrypting...
          </span>
        ) : (
          '🔓 Decrypt My Status'
        )}
      </button>
    </div>
  );
}

