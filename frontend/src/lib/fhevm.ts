import { createInstance, SepoliaConfig, FhevmInstance, FhevmInstanceConfig } from '@zama-fhe/relayer-sdk/web';
import { ethers } from 'ethers';

let fhevmInstance: FhevmInstance | null = null;

// Use environment variables from .env file for configuration
// This ensures we use the correct relayer URL (relayer.testnet.zama.org, not .cloud)
const useLocalRelayer = import.meta.env.VITE_USE_LOCAL_RELAYER === 'true';

// Local config for development (Hardhat network - chainId 31337)
// NOTE: This requires a local relayer running (via Docker)
const LocalConfig: FhevmInstanceConfig = {
  verifyingContractAddressDecryption: "0x0000000000000000000000000000000000000000",
  verifyingContractAddressInputVerification: "0x0000000000000000000000000000000000000000",
  kmsContractAddress: "0x0000000000000000000000000000000000000000",
  inputVerifierContractAddress: "0x0000000000000000000000000000000000000000",
  aclContractAddress: "0x0000000000000000000000000000000000000000",
  gatewayChainId: 31337,
  chainId: 31337,
  relayerUrl: "http://localhost:8010",
};

// CRITICAL FIX: Build COMPLETE custom config from environment variables
// DO NOT use SepoliaConfig as base - it has wrong .cloud URLs hardcoded
// Build everything from scratch using ONLY correct .org URLs
function buildSepoliaConfig(): FhevmInstanceConfig {
  // Read environment variables
  const envRelayerUrl = import.meta.env.VITE_RELAYER_URL;
  const envGatewayUrl = import.meta.env.VITE_GATEWAY_URL;
  const envChainId = import.meta.env.VITE_CHAIN_ID;
  const envRpcUrl = import.meta.env.VITE_RPC_URL;
  
  // CRITICAL: Always use .org domain, never .cloud
  let relayerUrl = envRelayerUrl || 'https://relayer.testnet.zama.org';
  let gatewayUrl = envGatewayUrl || 'https://gateway.testnet.zama.org';
  
  // Remove trailing slashes
  relayerUrl = relayerUrl.replace(/\/+$/, '');
  gatewayUrl = gatewayUrl.replace(/\/+$/, '');
  
  // Force .org if .cloud detected
  if (relayerUrl.includes('.zama.cloud')) {
    console.warn('⚠️ WARNING: .zama.cloud detected in relayer URL! Replacing with .org');
    relayerUrl = relayerUrl.replace('.zama.cloud', '.zama.org');
  }
  if (gatewayUrl.includes('.zama.cloud')) {
    console.warn('⚠️ WARNING: .zama.cloud detected in gateway URL! Replacing with .org');
    gatewayUrl = gatewayUrl.replace('.zama.cloud', '.zama.org');
  }
  
  // Sepolia chain ID
  const chainId = envChainId ? parseInt(envChainId, 10) : 11155111;
  
  // Get RPC URL - CRITICAL: SDK needs this to connect to blockchain
  // Only set rpcUrl if window.ethereum is NOT available (SDK prefers window.ethereum)
  let rpcUrl: string | undefined = undefined;
  const hasWindowEthereum = typeof window !== 'undefined' && !!(window as any).ethereum;
  
  if (!hasWindowEthereum) {
    // No window.ethereum, so we MUST provide rpcUrl
    rpcUrl = envRpcUrl || 'https://rpc.sepolia.org'; // Use env var or fallback to public RPC
  } else if (envRpcUrl) {
    // window.ethereum exists, but user provided rpcUrl in env - use it as fallback
    rpcUrl = envRpcUrl;
  }
  // If window.ethereum exists and no env rpcUrl, don't set rpcUrl (SDK will use window.ethereum)
  
  // Get contract addresses from SepoliaConfig (these should be correct)
  // But we'll override URLs completely
  const baseAddresses = SepoliaConfig;
  
  // Build complete config with CORRECT URLs
  const config: FhevmInstanceConfig = {
    // Contract addresses from SepoliaConfig (these are correct)
    verifyingContractAddressDecryption: baseAddresses.verifyingContractAddressDecryption,
    verifyingContractAddressInputVerification: baseAddresses.verifyingContractAddressInputVerification,
    kmsContractAddress: baseAddresses.kmsContractAddress,
    inputVerifierContractAddress: baseAddresses.inputVerifierContractAddress,
    aclContractAddress: baseAddresses.aclContractAddress,
    
    // Chain configuration
    chainId: chainId,
    gatewayChainId: baseAddresses.gatewayChainId || chainId,
    
    // CRITICAL: Use ONLY .org URLs (never .cloud)
    relayerUrl: relayerUrl,
  };
  
  // Only add rpcUrl to config if it's set (don't add if window.ethereum will be used)
  // Note: rpcUrl is not in the type definition but SDK accepts it
  if (rpcUrl) {
    (config as any).rpcUrl = rpcUrl;
  }
  
  const configRpcUrlForLog = (config as any).rpcUrl;
  console.log('🔧 Built custom config:', {
    relayerUrl: config.relayerUrl,
    rpcUrl: configRpcUrlForLog ? `${configRpcUrlForLog.substring(0, 30)}...` : '(not set)',
    chainId: config.chainId,
    gatewayChainId: config.gatewayChainId,
    hasAddresses: !!(config.aclContractAddress && config.kmsContractAddress),
  });
  
  return config;
}

// Force reload cache buster
console.log('🔄 Code version:', new Date().toISOString(), '- Using environment variables for config');

export async function initFhevm(provider?: ethers.BrowserProvider): Promise<FhevmInstance> {
  if (fhevmInstance) return fhevmInstance;
  
  // Build config from environment variables (reads from .env file)
  let config = useLocalRelayer ? LocalConfig : buildSepoliaConfig();
  const configName = useLocalRelayer ? 'Local (Requires Docker)' : 'Sepolia Public Relayer (from .env)';
  
  const relayerUrl = config.relayerUrl || 'https://relayer.testnet.zama.org';
  
  console.log('🔐 Initializing FHEVM with config:', configName);
  console.log('🌐 Relayer URL:', relayerUrl);
  console.log('📋 Environment variables:', {
    VITE_RELAYER_URL: import.meta.env.VITE_RELAYER_URL || '(not set, using default)',
    VITE_RPC_URL: import.meta.env.VITE_RPC_URL || '(not set, using fallback)',
    VITE_CHAIN_ID: import.meta.env.VITE_CHAIN_ID || '(not set, using default)',
  });
  
  // CRITICAL: Verify provider is available
  const hasWindowEthereum = typeof window !== 'undefined' && !!(window as any).ethereum;
  const configRpcUrl = (config as any).rpcUrl;
  if (!hasWindowEthereum && !configRpcUrl) {
    const error = '❌ No RPC URL or Ethereum provider found! Please set VITE_RPC_URL in .env or connect MetaMask.';
    console.error(error);
    throw new Error(error);
  }
  
  // CRITICAL: Verify URL is correct - must be .org, never .cloud
  if (!useLocalRelayer) {
    if (relayerUrl.includes('.zama.cloud')) {
      const error = `❌ WRONG URL DETECTED: ${relayerUrl}. The .cloud domain does not exist! Use .org instead.`;
      console.error(error);
      throw new Error(error);
    }
    if (!relayerUrl.includes('relayer.testnet.zama.org')) {
      console.warn(`⚠️ Unexpected relayer URL: ${relayerUrl}. Expected: https://relayer.testnet.zama.org`);
    } else {
      console.log('✅ Using CORRECT domain: relayer.testnet.zama.org');
    }
  }
  
  // Log FULL config before passing to SDK (for debugging)
  const configForLog = { ...config };
  if (configRpcUrl) {
    (configForLog as any).rpcUrl = `${configRpcUrl.substring(0, 40)}...`;
  }
  console.log('📋 Full config being sent to SDK:', JSON.stringify({
    ...configForLog,
    provider: hasWindowEthereum ? 'window.ethereum (auto-detected)' : (configRpcUrl ? 'rpcUrl from config' : 'NONE - ERROR!'),
  }, null, 2));
  
  // CRITICAL: Verify the exact URL one more time before SDK call
  if (config.relayerUrl && !config.relayerUrl.includes('relayer.testnet.zama.org')) {
    const error = `❌ FATAL: Config still has wrong URL: ${config.relayerUrl}`;
    console.error(error);
    throw new Error(error);
  }
  
  try {
    console.log('⏳ Creating FHEVM instance...');
    console.log('   Relayer URL:', config.relayerUrl);
    console.log('   This may take a few seconds...');
    console.log('   Fetching keys from relayer...');
    
    // Add timeout to detect if request is hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
    );
    
    // Log the exact moment we call createInstance
    const hasWindowEthereum = typeof window !== 'undefined' && !!(window as any).ethereum;
    const configRpcUrl = (config as any).rpcUrl;
    console.log('🚀 Calling createInstance with:', {
      relayerUrl: config.relayerUrl,
      rpcUrl: configRpcUrl ? `${configRpcUrl.substring(0, 40)}...` : '(not set - will use window.ethereum)',
      chainId: config.chainId,
      hasWindowEthereum: hasWindowEthereum,
    });
    
    // CRITICAL: According to Zama SDK docs, we have two options:
    // 1. Pass provider explicitly (preferred when wallet is connected)
    // 2. Use rpcUrl in config (fallback when no wallet)
    //
    // Option 1: Explicit provider (when wallet is connected)
    // Option 2: rpcUrl in config (when no wallet, use RPC directly)
    let instancePromise: Promise<FhevmInstance>;
    
    if (provider) {
      // Provider passed explicitly - use it (wallet is connected)
      // According to Zama SDK docs, provider can be passed in config object
      console.log('💡 Using explicit provider (wallet connected)');
      // Remove rpcUrl from config when using explicit provider
      const configWithProvider = { ...config };
      delete (configWithProvider as any).rpcUrl;
      // Add provider to config object (as per Zama SDK docs example)
      (configWithProvider as any).provider = provider;
      instancePromise = createInstance(configWithProvider);
    } else if (configRpcUrl) {
      // No explicit provider, but rpcUrl is set - use RPC directly
      console.log('💡 Using RPC URL from config (no wallet):', configRpcUrl);
      instancePromise = createInstance(config);
    } else if (hasWindowEthereum) {
      // Fallback: SDK will auto-detect window.ethereum
      console.log('💡 SDK will auto-detect window.ethereum (fallback)');
      const configWithoutRpc = { ...config };
      delete (configWithoutRpc as any).rpcUrl;
      instancePromise = createInstance(configWithoutRpc);
    } else {
      throw new Error('No provider available: No explicit provider, no rpcUrl, and window.ethereum not found');
    }
    fhevmInstance = await Promise.race([instancePromise, timeoutPromise]) as FhevmInstance;
    
    console.log('✅ FHEVM initialized successfully');
    if (!useLocalRelayer) {
      console.log('💡 Using Zama\'s public relayer on Sepolia - no local setup needed!');
    }
    return fhevmInstance;
  } catch (error: any) {
    console.error('❌ Failed to initialize FHEVM:', error);
    console.error('📋 Error details:', {
      message: error?.message,
      cause: error?.cause?.message,
      stack: error?.stack?.split('\n').slice(0, 3).join('\n')
    });
    
    // Provide helpful error messages
    if (error?.message?.includes('wrong relayer url') || error?.message?.includes('wrong relayer')) {
      console.error('🚨 WRONG RELAYER URL ERROR!');
      console.error('   The SDK is rejecting the relayer URL.');
      console.error('   Config relayerUrl:', config.relayerUrl);
      console.error('   ✅ Expected: https://relayer.testnet.zama.org');
      console.error('   ❌ Wrong: https://relayer.testnet.zama.cloud (DOES NOT EXIST)');
      console.error('   📋 Check Network tab in DevTools to see what URL is actually being called');
      console.error('   💡 Possible causes:');
      console.error('      1. Browser cache still has old code');
      console.error('      2. SDK internally using wrong URL');
      console.error('      3. Network/proxy modifying the URL');
      console.error('   🔧 Solutions:');
      console.error('      1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)');
      console.error('      2. Clear ALL browser cache and reload');
      console.error('      3. Restart Vite: Stop (Ctrl+C) and run "npm run dev" again');
      console.error('      4. Try incognito/private window (bypasses cache)');
      console.error('      5. Check Network tab - look for requests to .cloud domain');
    } else if (error?.message?.includes('wasm') || error?.message?.includes('_wbindgen')) {
      console.error('🚨 WebAssembly Loading Error!');
      console.error('   The SDK\'s WebAssembly module failed to load.');
      console.error('   This might be a browser compatibility issue.');
      console.error('   🔧 Solutions:');
      console.error('      1. Try a different browser (Chrome, Firefox, Edge)');
      console.error('      2. Disable browser extensions temporarily');
      console.error('      3. Check browser console for WebAssembly errors');
      console.error('      4. Clear browser cache completely');
      console.error('      5. Make sure you\'re using a modern browser (Chrome 90+, Firefox 88+)');
    } else if (error?.message?.includes('CORS') || error?.message?.includes('Cross-Origin')) {
      console.error('🚫 CORS Error Detected!');
      console.error('   Make sure your CORS extension is:');
      console.error('   1. Enabled (click icon, toggle ON)');
      console.error('   2. Active for localhost:3000');
      console.error('   3. Try disabling and re-enabling it');
      console.error('   4. Or use a local relayer instead');
    } else if (error?.message?.includes('Bad JSON') || error?.message?.includes('response')) {
      console.error('🔌 Relayer Response Issue!');
      console.error('   The relayer responded but with invalid JSON.');
      console.error('   This often happens when:');
      console.error('   1. CORS extension modifies the response incorrectly');
      console.error('   2. Network/proxy is interfering');
      console.error('   3. Relayer service is returning HTML error page instead of JSON');
      console.error('   💡 Solutions:');
      console.error('      → Try DISABLING the CORS extension and refresh');
      console.error('      → Check Network tab in DevTools to see actual response');
      console.error('      → Use local relayer: npm run relayer:start (requires Docker)');
    }
    
    if (useLocalRelayer) {
      console.warn('⚠️ Local relayer may not be running. Options:');
      console.warn('   1. Start Docker relayer: npm run relayer:start');
      console.warn('   2. OR use public relayer: Remove VITE_USE_LOCAL_RELAYER from .env');
    } else {
      console.warn('💡 Troubleshooting tips:');
      console.warn('   1. Check your internet connection');
      console.warn('   2. Verify you\'re on Sepolia testnet in MetaMask');
      console.warn('   3. Try refreshing the page');
      console.warn('   4. Check Zama community for service status');
    }
    
    // Re-throw to let the app handle it, but with better error context
    throw error;
  }
}

export async function encryptLoanInputs(
  contractAddress: string,
  userAddress: string,
  values: { income: number; repaymentScore: number; debt: number; loanAmount: number }
) {
  console.log('🔒 Starting encryption...', { values, contractAddress, userAddress });
  
  let fhe: FhevmInstance;
  try {
    fhe = await initFhevm();
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error';
    if (errorMsg.includes('CORS') || errorMsg.includes('Cross-Origin')) {
      throw new Error('CORS Error: Relayer is blocking browser requests. Install a CORS extension or use a local relayer. See RELAYER_CORS_FIX.md for details.');
    } else if (errorMsg.includes('Bad JSON') || errorMsg.includes('response')) {
      throw new Error('Relayer Connection Failed: The relayer service is not responding correctly. Please try again or use a local relayer.');
    } else {
      throw new Error(`FHEVM Initialization Failed: ${errorMsg}. Please check the console for details.`);
    }
  }
  
  if (!fhe) {
    throw new Error('FHEVM instance is null. Relayer initialization failed.');
  }
  
  const enc = await fhe.createEncryptedInput(contractAddress, userAddress);
  enc.add64(values.income);
  enc.add16(values.repaymentScore);
  enc.add64(values.debt);
  enc.add64(values.loanAmount);
  console.log('📦 Encrypting inputs with FHE...');
  const encryptResult = await enc.encrypt();
  // SDK may return different structure - handle both
  const inputs = (encryptResult as any).inputs || (encryptResult as any).handles || [];
  const attestation = (encryptResult as any).attestation || (encryptResult as any).inputProof || '';
  console.log('✅ Encryption successful!', {
    inputCount: inputs.length,
    attestationLength: typeof attestation === 'string' ? attestation.length : attestation?.length || 0,
    note: 'All data is now encrypted and ready for on-chain submission'
  });
  return { inputs, attestation };
}

export async function decryptApplication(
  contract: ethers.Contract,
  signer: ethers.JsonRpcSigner
) {
  console.log('🔓 Starting decryption process...');
  
  let fhe: FhevmInstance;
  try {
    fhe = await initFhevm();
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error';
    if (errorMsg.includes('CORS') || errorMsg.includes('Cross-Origin')) {
      throw new Error('CORS Error: Relayer is blocking browser requests. Install a CORS extension or use a local relayer. See RELAYER_CORS_FIX.md for details.');
    } else if (errorMsg.includes('Bad JSON') || errorMsg.includes('response')) {
      throw new Error('Relayer Connection Failed: The relayer service is not responding correctly. Please try again or use a local relayer.');
    } else {
      throw new Error(`FHEVM Initialization Failed: ${errorMsg}. Please check the console for details.`);
    }
  }
  
  if (!fhe) {
    throw new Error('FHEVM instance is null. Relayer initialization failed.');
  }
  console.log('📥 Fetching encrypted data from contract...');
  const [scoreHandle, approvedHandle] = await contract.getMyApplication();
  console.log('📋 Retrieved encrypted handles:', { scoreHandle, approvedHandle });

  const contractAddress = typeof contract.target === 'string' ? contract.target : contract.target.toString();
  const pairs = [
    { contractAddress, handle: scoreHandle },
    { contractAddress, handle: approvedHandle },
  ];

  // Get chainId from provider, not signer
  const provider = signer.provider;
  const network = provider ? await provider.getNetwork() : null;
  const chainId = network ? Number(network.chainId) : 11155111;
  const userAddress = await signer.getAddress();
  const now = Math.floor(Date.now() / 1000);
  const durationDays = 1;
  
  console.log('✍️ Creating EIP-712 typed data for decryption request...');
  
  // SDK API - createEIP712 expects chainId as string
  let typedData: any;
  try {
    typedData = await fhe.createEIP712(String(chainId), pairs as any, now, durationDays);
  } catch (e) {
    // Fallback if API is different
    const pairHandles = pairs.map(p => p.handle);
    typedData = await (fhe.createEIP712 as any)(String(chainId), pairHandles, now, durationDays);
  }

  console.log('🔐 Requesting user signature for decryption...');
  // In ethers v6, signTypedData is available directly on JsonRpcSigner
  const signature = await signer.signTypedData(
    typedData.domain, typedData.types, typedData.message
  );
  console.log('✅ Signature obtained, sending to relayer for decryption...');

  // SDK userDecrypt requires 8 parameters
  // Get public key from FHEVM instance if available
  const publicKey = (fhe as any).publicKey || '';
  const privateKey = ''; // Not needed for user decryption
  const contractAddresses = pairs.map(p => p.contractAddress);
  
  // Call userDecrypt with all required parameters
  const decryptedResult = await (fhe.userDecrypt as any)(
    pairs,
    privateKey,
    publicKey,
    signature,
    contractAddresses,
    userAddress,
    now,
    durationDays
  );
  
  const decryptedMap: Record<string, string> = {} as any;
  
  // Convert result to string map
  if (typeof decryptedResult === 'object' && decryptedResult !== null) {
    for (const [key, value] of Object.entries(decryptedResult)) {
      decryptedMap[String(key)] = String(value);
    }
  }

  const score = Number(decryptedMap[scoreHandle]);
  const approved = Number(decryptedMap[approvedHandle]);

  console.log('🎉 Decryption successful!', {
    score,
    approved: approved === 1 ? 'APPROVED' : 'REJECTED',
    note: 'Only you can see these decrypted values'
  });

  return { score, approved };
}

