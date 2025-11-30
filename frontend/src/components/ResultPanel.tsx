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
    <div className="bg-gradient-to-br from-gray-800/50 to-purple-900/30 rounded-xl shadow-2xl p-6 border-2 border-purple-500/30 backdrop-blur-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 text-gray-100">Your Loan Application Status</h2>
        <p className="text-gray-300 text-sm">
          🔓 Decrypt your confidential risk score and approval status. Only you can see this information.
        </p>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 border-2 border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-4 shadow-lg backdrop-blur-sm">
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
        <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-2 border-purple-500/50 text-purple-200 px-4 py-3 rounded-lg mb-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
            <span className="font-medium">{step}</span>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4 mb-4">
          <div className="bg-gradient-to-br from-gray-900/50 to-blue-900/30 rounded-xl p-6 border-2 border-gray-700/50 shadow-lg backdrop-blur-sm">
            <div className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">Risk Score</div>
            <div className="text-5xl font-bold text-gray-100 mb-2">{result.score}</div>
            <div className="text-xs text-gray-400 bg-gray-900/50 px-3 py-2 rounded-lg border border-gray-700/50">
              Formula: (Income × 2) + (Repayment Score × 3) - Debt - Loan Amount
            </div>
          </div>

          <div className={`rounded-xl p-6 border-2 shadow-lg transform transition-transform backdrop-blur-sm ${
            result.approved === 1 
              ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-500/50' 
              : 'bg-gradient-to-br from-red-900/40 to-orange-900/40 border-red-500/50'
          }`}>
            <div className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">Status</div>
            <div className={`text-4xl font-bold mb-2 ${result.approved === 1 ? 'text-green-400' : 'text-red-400'}`}>
              {result.approved === 1 ? '✓ Approved' : '✗ Rejected'}
            </div>
            {result.approved === 0 && (
              <div className="text-sm text-gray-300 mt-2 bg-gray-900/50 px-3 py-2 rounded-lg border border-gray-700/50">
                Your risk score is below the minimum threshold for approval.
              </div>
            )}
            {result.approved === 1 && (
              <div className="text-sm text-green-300 mt-2 bg-gray-900/50 px-3 py-2 rounded-lg font-medium border border-green-500/30">
                🎉 Congratulations! Your loan application has been approved.
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleDecrypt}
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-500 hover:to-pink-500 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg shadow-purple-500/50"
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

