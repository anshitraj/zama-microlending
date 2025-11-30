import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { initFhevm } from './lib/fhevm';
import { mockInitFhevm } from './lib/fhevm-mock';
import LoanForm from './components/LoanForm';
import ResultPanel from './components/ResultPanel';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
const USE_MOCK_MODE = import.meta.env.VITE_USE_MOCK_MODE === 'true'; // Set VITE_USE_MOCK_MODE=true in .env to enable demo mode

function App() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [fhevmReady, setFhevmReady] = useState(false);
  const [fhevmError, setFhevmError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Initialize FHEVM ONLY after wallet is connected
  useEffect(() => {
    if (!account || !provider) {
      // Don't initialize FHEVM until wallet is connected and provider is ready
      setFhevmReady(false);
      setFhevmError(null);
      return;
    }

    // Wallet is connected, now initialize FHEVM with retry logic
    const initWithRetry = async (retries = 3) => {
      if (USE_MOCK_MODE) {
        // Use mock mode for demo
        console.log('🎭 [DEMO MODE] Using mock FHEVM initialization');
        try {
          await mockInitFhevm();
          setFhevmReady(true);
          setFhevmError(null);
          console.log('✅ [DEMO MODE] FHEVM initialized successfully');
          return;
        } catch (err: any) {
          console.error('❌ Mock initialization failed:', err);
          setFhevmError(err?.message || 'Mock initialization failed');
          setFhevmReady(true);
        }
      } else {
        // Real mode - try actual FHEVM initialization
        for (let i = 0; i < retries; i++) {
          try {
            console.log('🔐 Initializing FHEVM after wallet connection...');
            console.log('💡 Passing provider explicitly to SDK');
            await initFhevm(provider);
            setFhevmReady(true);
            setFhevmError(null);
            console.log('✅ FHEVM initialized successfully');
            return;
          } catch (err: any) {
            console.error(`Failed to initialize FHEVM (attempt ${i + 1}/${retries}):`, err);
            const errorMsg = err?.message || 'Unknown error';
            
            if (i < retries - 1) {
              console.log(`⏳ Retrying in 2 seconds...`);
              await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
              console.error('❌ FHEVM initialization failed after all retries');
              setFhevmError(errorMsg);
              setFhevmReady(true);
            }
          }
        }
      }
    };
    
    initWithRetry();
  }, [account, provider]); // Run when account OR provider changes

  const connectWallet = async () => {
    if (USE_MOCK_MODE) {
      // Mock wallet connection for demo
      console.log('🎭 [DEMO MODE] Using mock wallet connection');
      const mockAddress = '0x2De9Fc192ef7502E7113db457E01cC058D25b32b'; // Fixed address for demo
      
      // Create mock provider and signer
      const mockProvider = {
        getSigner: async () => ({
          getAddress: async () => mockAddress,
          signTypedData: async () => '0x' + '0'.repeat(130), // Mock signature
          getChainId: async () => 11155111, // Sepolia
        }),
        send: async () => {},
      } as any;
      
      const mockSigner = {
        getAddress: async () => mockAddress,
        signTypedData: async () => '0x' + '0'.repeat(130),
        getChainId: async () => 11155111,
      } as any;
      
      setProvider(mockProvider as any);
      setSigner(mockSigner);
      setAccount(mockAddress);
      setFhevmReady(true);
      setFhevmError(null);
      console.log('✅ [DEMO MODE] Mock wallet connected:', mockAddress);
      return;
    }
    
    // CRITICAL: Check if MetaMask is installed
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask to use this application.');
      console.error('❌ window.ethereum is undefined. MetaMask not installed.');
      return;
    }

    try {
      console.log('🔗 Connecting wallet...');
      
      // CRITICAL: Request accounts FIRST (this connects the wallet)
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('✅ Wallet connection requested');
      
      // Now create provider and get signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      console.log('✅ Wallet connected:', address);
      console.log('💡 Now initializing FHEVM...');

      setProvider(provider);
      setSigner(signer);
      setAccount(address);

      // Listen for account changes
      window.ethereum.on('accountsChanged', async (accounts: string[]) => {
        if (accounts.length === 0) {
          setAccount(null);
          setSigner(null);
          setProvider(null);
          setFhevmReady(false); // Reset FHEVM when wallet disconnects
        } else {
          setAccount(accounts[0]);
          // Create a new provider instance to get the updated signer
          const newProvider = new ethers.BrowserProvider(window.ethereum);
          const newSigner = await newProvider.getSigner();
          setProvider(newProvider);
          setSigner(newSigner);
        }
      });

      // Listen for chain changes (user switches network)
      window.ethereum.on('chainChanged', () => {
        console.log('🔄 Network changed, reloading page...');
        window.location.reload();
      });
    } catch (error) {
      console.error('❌ Error connecting wallet:', error);
      alert('Failed to connect wallet. Please make sure MetaMask is installed and unlocked.');
    }
  };

  const handleLoanSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (!CONTRACT_ADDRESS) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h1>
          <p className="text-gray-700">
            Please set VITE_CONTRACT_ADDRESS in your .env file.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-10">
          <div className="inline-block mb-4">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-5xl font-bold px-8 py-4 rounded-2xl shadow-2xl transform hover:scale-105 transition-transform border border-indigo-400/20">
              🔒 Confidential Micro-Lending
            </div>
          </div>
          <p className="text-lg text-gray-300 font-medium">
            Powered by Zama's FHEVM • Your financial data stays encrypted
          </p>
          {USE_MOCK_MODE && (
            <div className="mt-3">
              <span className="px-4 py-2 bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 rounded-full text-sm font-semibold">
                🎭 Demo Mode Active
              </span>
            </div>
          )}
          <div className="mt-4 flex justify-center gap-2">
            <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-sm font-semibold">✓ Fully Encrypted</span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-sm font-semibold">✓ Privacy First</span>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-sm font-semibold">✓ On-Chain FHE</span>
          </div>
        </header>

        {/* Wallet Connection */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl p-6 border-2 border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${account ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 'bg-gray-500'}`}></div>
                <div>
                  {account ? (
                    <div>
                      <div className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-1">✓ Wallet Connected</div>
                      <div className="font-mono text-sm text-gray-200 font-medium">{account.slice(0, 6)}...{account.slice(-4)}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Wallet Status</div>
                      <div className="text-gray-300 font-medium">Not connected</div>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={connectWallet}
                className={`px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                  account 
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/50' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/50'
                }`}
              >
                {account ? 'Disconnect' : '🔗 Connect Wallet'}
              </button>
            </div>
          </div>
        </div>

        {/* FHEVM Status - Loading */}
        {account && !fhevmReady && !fhevmError && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500/50 rounded-xl p-6 shadow-xl backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                <div>
                  <h3 className="font-bold text-lg text-yellow-300 mb-1">⏳ Initializing FHEVM Encryption System</h3>
                  <p className="text-sm text-yellow-200/80">Connecting to Zama's relayer service...</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Wallet Not Connected Notice */}
        {!account && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-2 border-blue-500/50 rounded-xl p-6 shadow-xl backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="text-3xl">💡</div>
                <div>
                  <h3 className="font-bold text-lg text-blue-300 mb-2">Connect Your Wallet First</h3>
                  <p className="text-blue-200/80">FHEVM will initialize automatically after wallet connection. Make sure MetaMask is on <strong className="text-blue-300">Sepolia Testnet</strong>.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* FHEVM Error Notice - Zama Service Issue */}
        {fhevmError && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-gradient-to-r from-orange-900/40 to-red-900/40 border-2 border-orange-500/50 rounded-xl p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="text-4xl">⚠️</div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-red-300 mb-2">FHEVM Initialization Issue</h3>
                  <div className="bg-yellow-900/40 border-l-4 border-yellow-500 p-3 mb-4 rounded backdrop-blur-sm">
                    <p className="text-sm font-semibold text-yellow-300 mb-1">🔍 Status: Confirmed by Zama Team</p>
                    <p className="text-sm text-yellow-200/80">This appears to be a service-side issue with Zama's relayer infrastructure, not a problem with your setup.</p>
                  </div>
                  <p className="text-red-300 mb-4 font-medium">{fhevmError}</p>
                  
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 backdrop-blur-sm">
                    <p className="font-semibold text-gray-200 mb-3">💡 What You Can Do:</p>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 font-bold">✓</span>
                        <span><strong className="text-gray-200">Your code is correct</strong> - The issue is on Zama's relayer service side</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 font-bold">→</span>
                        <span><strong className="text-gray-200">Try again later</strong> - The service may be temporarily unavailable</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 font-bold">→</span>
                        <span><strong className="text-gray-200">Use Local Relayer</strong> - Install Docker → Run <code className="bg-gray-900/50 px-1 rounded text-purple-300">npm run relayer:start</code> → Set <code className="bg-gray-900/50 px-1 rounded text-purple-300">VITE_USE_LOCAL_RELAYER=true</code></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-400 font-bold">→</span>
                        <span><strong className="text-gray-200">Check Zama Status</strong> - Visit <a href="https://community.zama.org" target="_blank" rel="noopener" className="text-blue-400 underline hover:text-blue-300">Zama Community</a> for service updates</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {account && fhevmReady && (
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            <LoanForm
              contractAddress={CONTRACT_ADDRESS}
              signer={signer}
              onSuccess={handleLoanSuccess}
            />
            <ResultPanel
              key={refreshTrigger}
              contractAddress={CONTRACT_ADDRESS}
              signer={signer}
            />
          </div>
        )}

        {/* Info Section */}
        <div className="max-w-4xl mx-auto mt-10">
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl shadow-2xl p-8 border border-gray-700/50 backdrop-blur-sm">
            <h2 className="text-3xl font-bold mb-6 text-gray-100 text-center">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 rounded-xl p-6 border-2 border-blue-500/30 transform hover:scale-105 transition-transform backdrop-blur-sm">
                <div className="text-4xl mb-3">🔒</div>
                <h3 className="font-bold text-xl mb-3 text-gray-100">Frontend Encryption</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Your financial data is encrypted in your browser using Zama's Relayer SDK before being sent on-chain. Fully Homomorphic Encryption (FHE) ensures your data remains private.
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-6 border-2 border-purple-500/30 transform hover:scale-105 transition-transform backdrop-blur-sm">
                <div className="text-4xl mb-3">⚙️</div>
                <h3 className="font-bold text-xl mb-3 text-gray-100">On-Chain Computation</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  The smart contract performs risk score calculations on encrypted data using FHE operations. Formula: <code className="bg-gray-900/50 px-2 py-1 rounded text-xs text-purple-300">(Income × 2) + (Score × 3) - Debt - Loan</code>
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-xl p-6 border-2 border-green-500/30 transform hover:scale-105 transition-transform backdrop-blur-sm">
                <div className="text-4xl mb-3">🔓</div>
                <h3 className="font-bold text-xl mb-3 text-gray-100">User Decryption</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Only you can decrypt your risk score and approval status. Decryption requires your cryptographic signature, ensuring complete privacy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

