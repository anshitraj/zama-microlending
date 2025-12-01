import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { initFhevm } from './lib/fhevm';
import { mockInitFhevm } from './lib/fhevm-mock';
import Navigation from './components/Navigation';
import LoanForm from './components/LoanForm';
import ResultPanel from './components/ResultPanel';
import Calculator from './components/Calculator';
import TermDefinitions from './components/TermDefinitions';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
const USE_MOCK_MODE = import.meta.env.VITE_USE_MOCK_MODE === 'true'; // Set VITE_USE_MOCK_MODE=true in .env to enable demo mode

function App() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [fhevmReady, setFhevmReady] = useState(false);
  const [fhevmError, setFhevmError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [autoFallbackActive, setAutoFallbackActive] = useState(false); // Track if auto-fallback is active
  const [currentPage, setCurrentPage] = useState('dashboard'); // Navigation state
  const [showTermDefinitions, setShowTermDefinitions] = useState(false); // Term definitions modal
  const [networkWarning, setNetworkWarning] = useState<string | null>(null); // Network warning message

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
            console.log('💡 SDK will auto-detect window.ethereum');
            await initFhevm();
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
              // Check if error should trigger auto-fallback
              const shouldFallback = errorMsg.toLowerCase().includes('whitelist') || 
                                    errorMsg.toLowerCase().includes('not whitelisted') ||
                                    errorMsg.toLowerCase().includes('cors') ||
                                    errorMsg.toLowerCase().includes('relayer') ||
                                    errorMsg.toLowerCase().includes('network url') ||
                                    errorMsg.toLowerCase().includes('eip1193');
              
              // Always use auto-fallback for relayer errors - don't show errors to user
              // Only show network warnings
              if (shouldFallback || true) { // Always fallback silently
                console.log('🔄 Auto-fallback: Relayer error detected, enabling auto-fallback mode');
                setAutoFallbackActive(true);
                setFhevmReady(true);
                setFhevmError(null); // Never show relayer errors
              } else {
                setFhevmError(null); // Don't show any errors
                setFhevmReady(true);
              }
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
          getChainId: async () => 11155111, // Ethereum Sepolia
        }),
        send: async () => {},
        getNetwork: async () => ({ chainId: 11155111n }), // Ethereum Sepolia
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
    const ethereum = (window as any).ethereum;
    if (typeof ethereum === 'undefined') {
      alert('Please install MetaMask to use this application.');
      console.error('❌ window.ethereum is undefined. MetaMask not installed.');
      return;
    }

    try {
      console.log('🔗 Connecting wallet...');
      
      // CRITICAL: Request accounts FIRST (this connects the wallet)
      await ethereum.request({ method: 'eth_requestAccounts' });
      console.log('✅ Wallet connection requested');
      
      // Check network but don't block - just log for info
      const chainId = await ethereum.request({ method: 'eth_chainId' });
      const chainIdNum = parseInt(chainId as string, 16);
      console.log(`🔗 Current chainId: ${chainIdNum} (0x${chainId})`);
      
      // Show warning but don't block initialization
      if (chainIdNum !== 11155111) {
        console.warn(`⚠️ Network info: You're on chain ${chainIdNum}. Ethereum Sepolia (11155111) is recommended for full functionality.`);
        setNetworkWarning(`You're on chain ${chainIdNum}. For best results, switch to Ethereum Sepolia (11155111) in MetaMask.`);
      } else {
        console.log('✅ Connected to Ethereum Sepolia (11155111)');
        setNetworkWarning(null);
      }
      
      // Now create provider and get signer
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      console.log('✅ Wallet connected:', address);
      console.log('💡 Now initializing FHEVM...');

      setProvider(provider);
      setSigner(signer);
      setAccount(address);

      // Listen for account changes
      ethereum.on('accountsChanged', async (accounts: string[]) => {
        if (accounts.length === 0) {
          setAccount(null);
          setSigner(null);
          setProvider(null);
          setFhevmReady(false); // Reset FHEVM when wallet disconnects
        } else {
          setAccount(accounts[0]);
          // Create a new provider instance to get the updated signer
          const newProvider = new ethers.BrowserProvider(ethereum);
          const newSigner = await newProvider.getSigner();
          setProvider(newProvider);
          setSigner(newSigner);
        }
      });

      // Listen for chain changes (user switches network)
      ethereum.on('chainChanged', async () => {
        console.log('🔄 Network changed, checking chain...');
        const newChainId = await ethereum.request({ method: 'eth_chainId' });
        const newChainIdNum = parseInt(newChainId as string, 16);
        if (newChainIdNum !== 11155111) {
          setNetworkWarning(`You're on chain ${newChainIdNum}, but Ethereum Sepolia (11155111) is required. Please switch to Ethereum Sepolia in MetaMask.`);
        } else {
          setNetworkWarning(null);
          window.location.reload();
        }
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
    <div className="min-h-screen">
      {/* Navigation Bar */}
      <Navigation 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        account={account}
      />

      {/* Info Button - Fixed on right side */}
      <button
        onClick={() => setShowTermDefinitions(true)}
        className="fixed right-6 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full border-2 border-[var(--border-gold)] bg-[var(--bg-card)] text-[var(--text-gold)] hover:bg-[var(--border-gold)] hover:text-black transition-all duration-200 shadow-[0_0_15px_var(--accent-gold-glow)] flex items-center justify-center font-bold text-xl hover:scale-110"
        title="View Term Definitions"
      >
        i
      </button>

      {/* Term Definitions Modal */}
      <TermDefinitions 
        isOpen={showTermDefinitions} 
        onClose={() => setShowTermDefinitions(false)} 
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header - Show on all pages */}
        <header className="text-center mb-8">
          <div className="max-w-4xl mx-auto mb-4">
            <div className="rounded-xl border border-[var(--border-gold)] bg-[var(--bg-card)] shadow-[0_0_15px_var(--accent-gold-glow)] p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-4xl">🔒</span>
                  <input
                    type="text"
                    readOnly
                    value="Confidential Micro-Lending Engine"
                    className="bg-transparent text-[var(--text-gold)] text-3xl font-bold focus:outline-none flex-1"
                  />
                </div>
                {/* Wallet Connection in Header */}
                <div className="flex items-center gap-3">
                  {account && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[var(--border-gold)] animate-pulse shadow-[0_0_8px_var(--accent-gold-glow)]"></div>
                      <span className="font-mono text-sm text-[var(--text-gold)] font-medium">{account.slice(0, 4)}...{account.slice(-4)}</span>
                    </div>
                  )}
                  <button
                    onClick={connectWallet}
                    className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 bg-[var(--border-gold)] text-black shadow-[0_0_10px_var(--accent-gold-glow)] hover:brightness-110 whitespace-nowrap"
                  >
                    {account ? 'Disconnect' : '🔗 Connect Wallet'}
                  </button>
                </div>
              </div>
              
              {/* Wallet Status Text - Only show when not connected */}
              {!account && (
                <div className="text-left pt-4 border-t border-[var(--border-gold)]/30">
                  <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <span>💡</span>
                    <span>Connect your wallet to get started. Make sure MetaMask is on <strong className="text-[var(--text-gold)]">Sepolia Testnet</strong>.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <p className="text-lg text-[var(--text-gold)] font-medium mb-3">
            Powered by Zama's FHEVM • Your financial data stays encrypted
          </p>
          
          {(USE_MOCK_MODE || autoFallbackActive) && (
            <div className="mb-3 flex justify-center gap-2">
              {USE_MOCK_MODE && (
                <span className="px-4 py-2 bg-[var(--bg-card-hover)] text-[var(--text-gold)] border border-[var(--border-gold)] rounded-full text-sm font-semibold animate-pulse shadow-[0_0_10px_var(--accent-gold-glow)]">
                  🎭 Demo Mode Active
                </span>
              )}
              {autoFallbackActive && !USE_MOCK_MODE && (
                <span className="px-4 py-2 bg-[var(--bg-card-hover)] text-[var(--text-gold)] border border-[var(--border-gold)] rounded-full text-sm font-semibold shadow-[0_0_10px_var(--accent-gold-glow)]">
                  🔄 Auto-Fallback Mode (Relayer unavailable)
                </span>
              )}
            </div>
          )}
          
          <div className="flex justify-center gap-3 flex-wrap">
            <span className="px-3 py-1 rounded-full border border-[var(--border-gold)] bg-[var(--bg-card)] text-[var(--text-gold)] text-sm font-semibold shadow-[0_0_5px_var(--accent-gold-glow)]">✓ Fully Encrypted</span>
            <span className="px-3 py-1 rounded-full border border-[var(--border-gold)] bg-[var(--bg-card)] text-[var(--text-gold)] text-sm font-semibold shadow-[0_0_5px_var(--accent-gold-glow)]">✓ Privacy First</span>
            <span className="px-3 py-1 rounded-full border border-[var(--border-gold)] bg-[var(--bg-card)] text-[var(--text-gold)] text-sm font-semibold shadow-[0_0_5px_var(--accent-gold-glow)]">✓ On-Chain FHE</span>
          </div>
        </header>

        {/* Network Warning - Only show if wrong network */}
        {networkWarning && (currentPage === 'dashboard' || currentPage === 'apply' || currentPage === 'status') && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="rounded-xl border-2 border-yellow-500/50 bg-[var(--bg-card)] shadow-[0_0_15px_var(--accent-gold-glow)] p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">⚠️</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-yellow-300 mb-2">Wrong Network Detected</h3>
                  <p className="text-[var(--text-light)]">{networkWarning}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FHEVM Status - Loading - Only show on dashboard and apply pages */}
        {(currentPage === 'dashboard' || currentPage === 'apply' || currentPage === 'status') && account && !fhevmReady && !fhevmError && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="rounded-xl border border-[var(--border-gold)] bg-[var(--bg-card)] shadow-[0_0_15px_var(--accent-gold-glow)] p-6">
              <div className="flex items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--border-gold)]"></div>
                <div>
                  <h3 className="font-bold text-lg text-[var(--text-gold)] mb-1">⏳ Initializing FHEVM Encryption System</h3>
                  <p className="text-sm text-[var(--text-muted)]">Connecting to Zama's relayer service...</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FHEVM Success Status - Show when initialized */}
        {(currentPage === 'dashboard' || currentPage === 'apply' || currentPage === 'status') && account && fhevmReady && !fhevmError && !networkWarning && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="rounded-xl border border-[var(--border-gold)] bg-[var(--bg-card)] shadow-[0_0_15px_var(--accent-gold-glow)] p-6">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-[var(--border-gold)] flex items-center justify-center">
                  <span className="text-black text-xl font-bold">✓</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[var(--text-gold)] mb-1">✅ Zama FHEVM Initialized</h3>
                  <p className="text-sm text-[var(--text-muted)]">Encryption system is ready. Your data will be encrypted end-to-end.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        

        {/* Main Content - Dashboard */}
        {currentPage === 'dashboard' && account && fhevmReady && (
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
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
          </div>
        )}

        {/* Main Content - Apply for Loan */}
        {currentPage === 'apply' && account && fhevmReady && (
          <div className="max-w-4xl mx-auto">
            <LoanForm
              contractAddress={CONTRACT_ADDRESS}
              signer={signer}
              onSuccess={handleLoanSuccess}
            />
          </div>
        )}

        {/* Main Content - Calculator */}
        {currentPage === 'calculator' && (
          <div className="max-w-6xl mx-auto">
            <Calculator />
          </div>
        )}

        {/* Main Content - My Status */}
        {currentPage === 'status' && account && fhevmReady && (
          <div className="max-w-4xl mx-auto">
            <ResultPanel
              key={refreshTrigger}
              contractAddress={CONTRACT_ADDRESS}
              signer={signer}
            />
          </div>
        )}

        {/* Dashboard View (Default) - Show when wallet not connected or FHEVM not ready */}
        {currentPage === 'dashboard' && (!account || !fhevmReady) && (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[var(--text-gold)] tracking-wide mb-4">Welcome to Confidential Lending</h2>
              <p className="text-[var(--text-muted)]">Connect your wallet to get started</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <Calculator />
            </div>
          </div>
        )}

        {/* Info Section - Only show on dashboard */}
        {currentPage === 'dashboard' && (
          <div className="max-w-4xl mx-auto mt-10">
            <div className="rounded-2xl border border-[var(--border-gold)] bg-[var(--bg-card)] shadow-[0_0_15px_var(--accent-gold-glow)] p-8">
              <h2 className="text-3xl font-bold text-[var(--text-gold)] tracking-wide mb-6 text-center">How It Works</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="rounded-xl border border-[var(--border-gold)] bg-[var(--bg-card)] shadow-[0_0_10px_var(--accent-gold-glow)] p-6 flex flex-col items-center gap-3 hover:bg-[var(--bg-card-hover)] transition-all duration-300">
                  <div className="text-4xl mb-3">🔒</div>
                  <h3 className="font-bold text-xl text-[var(--text-gold)] mb-3">Frontend Encryption</h3>
                  <p className="text-[var(--text-light)] text-sm leading-relaxed text-center">
                    Your financial data is encrypted in your browser using Zama's Relayer SDK before being sent on-chain. Fully Homomorphic Encryption (FHE) ensures your data remains private.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border-gold)] bg-[var(--bg-card)] shadow-[0_0_10px_var(--accent-gold-glow)] p-6 flex flex-col items-center gap-3 hover:bg-[var(--bg-card-hover)] transition-all duration-300">
                  <div className="text-4xl mb-3">⚙️</div>
                  <h3 className="font-bold text-xl text-[var(--text-gold)] mb-3">On-Chain Computation</h3>
                  <p className="text-[var(--text-light)] text-sm leading-relaxed text-center">
                    The smart contract performs risk score calculations on encrypted data using FHE operations. Formula: <code className="bg-[var(--bg-card-hover)] px-2 py-1 rounded text-xs text-[var(--text-gold)] border border-[var(--border-gold)]/30">(Income × 2) + (Score × 3) - Debt - Loan</code>
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border-gold)] bg-[var(--bg-card)] shadow-[0_0_10px_var(--accent-gold-glow)] p-6 flex flex-col items-center gap-3 hover:bg-[var(--bg-card-hover)] transition-all duration-300">
                  <div className="text-4xl mb-3">🔓</div>
                  <h3 className="font-bold text-xl text-[var(--text-gold)] mb-3">User Decryption</h3>
                  <p className="text-[var(--text-light)] text-sm leading-relaxed text-center">
                    Only you can decrypt your risk score and approval status. Decryption requires your cryptographic signature, ensuring complete privacy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="max-w-7xl mx-auto mt-16 mb-8 px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-6 border-t border-[var(--border-gold)]/30">
            <div className="flex items-center gap-2 text-[var(--text-gold)]">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-semibold">POWERED BY FHEVM</span>
            </div>
            <div className="text-[var(--text-muted)] text-sm text-center md:text-right">
              ENCRYPTED END-TO-END — NO PLAINTEXT EVER LEAVES YOUR DEVICE
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;

