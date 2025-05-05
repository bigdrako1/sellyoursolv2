
import { PublicKey } from '@solana/web3.js';
import { 
  PhantomWalletAdapter, 
  SolflareWalletAdapter,
  BackpackWalletAdapter,
  GlowWalletAdapter,
  ExodusWalletAdapter,
  BraveWalletAdapter,
  SalmonWalletAdapter,
  TrustWalletAdapter,
  CloverWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { 
  WalletAdapterNetwork,
  WalletReadyState,
  WalletName,
  Adapter
} from '@solana/wallet-adapter-base';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { toast } from "@/components/ui/use-toast";

// List of supported wallets
export const getSupportedWallets = () => {
  // We can customize network here
  const network = WalletAdapterNetwork.Mainnet;
  
  return [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({ network }),
    new BackpackWalletAdapter(),
    new GlowWalletAdapter(),
    new ExodusWalletAdapter(),
    new BraveWalletAdapter(),
    new SalmonWalletAdapter(),
    new TrustWalletAdapter(),
    new CloverWalletAdapter(),
  ];
};

// Type for our wallet providers
export interface WalletProviderInfo {
  name: string;
  adapter: Adapter;
  icon: string;
  url: string;
  readyState: WalletReadyState;
}

// Get all available wallet providers
export const getAvailableWalletProviders = (): WalletProviderInfo[] => {
  const wallets = getSupportedWallets();
  
  return wallets.map(adapter => ({
    name: adapter.name,
    adapter: adapter,
    icon: adapter.icon,
    url: adapter.url || "",
    readyState: adapter.readyState
  })).sort((a, b) => {
    // Sort by ready state first
    if (a.readyState === WalletReadyState.Installed && b.readyState !== WalletReadyState.Installed) {
      return -1;
    }
    if (a.readyState !== WalletReadyState.Installed && b.readyState === WalletReadyState.Installed) {
      return 1;
    }
    
    // Then by name
    return a.name.localeCompare(b.name);
  });
};

// Detect any supported wallet
export const detectWallets = async (): Promise<{ 
  available: boolean; 
  installedWallets: WalletProviderInfo[];
  loadableWallets: WalletProviderInfo[];
}> => {
  try {
    const providers = getAvailableWalletProviders();
    
    // Detect installed wallets (already in browser)
    const installedWallets = providers.filter(
      provider => provider.readyState === WalletReadyState.Installed || 
                 provider.readyState === WalletReadyState.Loadable
    );
    
    // Wallets that need to be installed
    const loadableWallets = providers.filter(
      provider => provider.readyState === WalletReadyState.NotDetected || 
                 provider.readyState === WalletReadyState.Unsupported
    );
    
    console.log("Wallet detection results:", {
      installed: installedWallets.length ? installedWallets.map(w => w.name) : "None",
      loadable: loadableWallets.length ? loadableWallets.map(w => w.name) : "None"
    });
    
    return {
      available: installedWallets.length > 0,
      installedWallets,
      loadableWallets
    };
  } catch (error) {
    console.error('Error detecting wallets:', error);
    return {
      available: false,
      installedWallets: [],
      loadableWallets: []
    };
  }
};

/**
 * Connect to wallet
 * @param adapterName Name of wallet adapter to connect to
 * @returns Promise with connection result
 */
export const connectWallet = async (adapterName: string): Promise<{ 
  success: boolean; 
  address?: string; 
  error?: string;
  walletName?: string;
}> => {
  try {
    console.log(`Attempting to connect to wallet: ${adapterName}`);
    
    // Get all wallet providers
    const providers = getAvailableWalletProviders();
    
    // Find the selected provider
    const selectedProvider = providers.find(provider => 
      provider.adapter.name.toLowerCase() === adapterName.toLowerCase()
    );
    
    if (!selectedProvider) {
      console.error(`Wallet provider ${adapterName} not found`);
      throw new Error(`Wallet provider ${adapterName} not found`);
    }
    
    const adapter = selectedProvider.adapter;
    
    // Connect to the wallet
    console.log("Connecting to wallet adapter...");
    
    if (adapter.readyState !== WalletReadyState.Installed && 
        adapter.readyState !== WalletReadyState.Loadable) {
      console.error(`${adapter.name} wallet is not installed`);
      throw new Error(`${adapter.name} wallet is not installed`);
    }
    
    if (!adapter.publicKey) {
      await adapter.connect();
    }
    
    if (!adapter.publicKey) {
      throw new Error('Failed to connect wallet: No public key available');
    }
    
    // Get the wallet address
    const publicKey = adapter.publicKey.toString();
    
    // Save wallet info to localStorage for persistence
    localStorage.setItem('walletAddress', publicKey);
    localStorage.setItem('walletProvider', adapter.name);
    
    console.log(`Successfully connected to ${adapter.name} wallet:`, publicKey);
    
    return {
      success: true,
      address: publicKey,
      walletName: adapter.name
    };
  } catch (error: any) {
    console.error('Error connecting to wallet:', error);
    
    // Handle user rejection specifically
    if (error.message?.includes('User rejected')) {
      return {
        success: false,
        error: 'Connection rejected by user'
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error connecting to wallet'
    };
  }
};

/**
 * Get connected wallet from localStorage
 * @returns string | null - Connected wallet address or null if not connected
 */
export const getConnectedWallet = (): { address: string | null; provider: string | null } => {
  try {
    const address = localStorage.getItem('walletAddress');
    const provider = localStorage.getItem('walletProvider');
    
    if (address && provider) {
      return { address, provider };
    }
    
    return { address: null, provider: null };
  } catch (error) {
    console.error('Error getting connected wallet:', error);
    return { address: null, provider: null };
  }
};

/**
 * Disconnect wallet
 * @returns Promise<boolean> - True if disconnected successfully
 */
export const disconnectWallet = async (): Promise<boolean> => {
  try {
    // Get the current wallet provider name
    const walletProvider = localStorage.getItem('walletProvider');
    
    // Clear wallet info from localStorage
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletProvider');
    
    // If a wallet was connected, try to disconnect properly
    if (walletProvider) {
      try {
        const providers = getAvailableWalletProviders();
        
        // Find the provider that was connected
        const provider = providers.find(p => p.name === walletProvider);
        
        if (provider && provider.adapter) {
          // Call disconnect on the adapter if it's connected
          if (provider.adapter.connected) {
            await provider.adapter.disconnect();
          }
        }
      } catch (error) {
        console.error('Error disconnecting from wallet adapter:', error);
        // We still return true since we cleared localStorage
      }
    }
    
    console.log('Wallet disconnected successfully');
    return true;
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
    return false;
  }
};

/**
 * Sign a message with connected wallet
 * @param message Message to sign
 * @returns Promise with signature result
 */
export const signMessage = async (message: string): Promise<{ 
  success: boolean; 
  signature?: Uint8Array; 
  error?: string 
}> => {
  try {
    // Get wallet info from localStorage
    const { address, provider } = getConnectedWallet();
    
    if (!address || !provider) {
      throw new Error('No wallet connected');
    }
    
    const providers = getAvailableWalletProviders();
    const walletProvider = providers.find(p => p.name === provider);
    
    if (!walletProvider || !walletProvider.adapter) {
      throw new Error(`${provider} wallet adapter not found`);
    }
    
    const adapter = walletProvider.adapter;
    
    // Make sure wallet is connected
    if (!adapter.connected) {
      await adapter.connect();
    }
    
    // Convert message to Uint8Array
    const encodedMessage = new TextEncoder().encode(message);
    
    // Request signature
    const signature = await adapter.signMessage(encodedMessage);
    
    console.log('Message signed successfully with wallet');
    
    return {
      success: true,
      signature
    };
  } catch (error: any) {
    console.error('Error signing message with wallet:', error);
    
    // Handle user rejection specifically
    if (error.message?.includes('User rejected')) {
      return {
        success: false,
        error: 'Signing rejected by user'
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error signing message'
    };
  }
};

/**
 * Verify a wallet signature
 * @param publicKey The wallet address
 * @param message The original message that was signed
 * @param signature The signature to verify
 * @returns Promise<boolean> - True if signature is valid
 */
export const verifyWalletSignature = async (
  publicKey: string,
  message: string,
  signature: Uint8Array
): Promise<boolean> => {
  try {
    // Convert message to Uint8Array
    const encodedMessage = new TextEncoder().encode(message);
    
    // Convert publicKey to PublicKey object
    const pubKey = new PublicKey(publicKey);
    
    // Verify signature
    const isValid = nacl.sign.detached.verify(
      encodedMessage,
      signature,
      pubKey.toBytes()
    );
    
    console.log('Signature verification result:', isValid);
    
    return isValid;
  } catch (error) {
    console.error('Error verifying wallet signature:', error);
    return false;
  }
};

/**
 * Check if wallet is connected
 * @returns boolean - True if wallet is connected
 */
export const isWalletConnected = (): boolean => {
  const { address } = getConnectedWallet();
  return address !== null;
};

/**
 * Format wallet address for display
 * @param address Full wallet address
 * @param length Number of characters to show at start and end
 * @returns Formatted wallet address (e.g. "Ax12...3Bcd")
 */
export const formatWalletAddress = (address: string | null, length = 4): string => {
  if (!address) return '';
  return `${address.slice(0, length)}...${address.slice(-length)}`;
};
