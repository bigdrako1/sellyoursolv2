
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { toast } from "@/components/ui/use-toast";

/**
 * Detect if Phantom wallet is installed
 * @returns Promise<boolean> - True if Phantom is installed
 */
export const detectPhantomWallet = async (): Promise<boolean> => {
  try {
    // Check for Phantom in multiple ways to increase detection reliability
    const isPhantomInstalled = (
      // Standard way to detect Phantom
      (window as any).phantom?.solana?.isPhantom || 
      // Fallback detection method
      typeof (window as any).solana?.isPhantom !== 'undefined'
    );
    
    console.log("Phantom detection result:", isPhantomInstalled);
    return isPhantomInstalled;
  } catch (error) {
    console.error('Error detecting Phantom wallet:', error);
    return false;
  }
};

/**
 * Connect to Phantom wallet
 * @returns Promise with connection result
 */
export const connectPhantomWallet = async (): Promise<{ success: boolean; address?: string; error?: string }> => {
  try {
    console.log("Attempting to connect to Phantom wallet");
    
    // Check if Phantom exists on window.solana or window.phantom.solana
    const provider = (window as any).phantom?.solana || (window as any).solana;
    
    // If neither exists, Phantom is not installed
    if (!provider || !provider.isPhantom) {
      console.error("No Phantom provider found on window");
      throw new Error('Phantom wallet is not installed');
    }
    
    // Try to connect
    console.log("Provider found, connecting...");
    const response = await provider.connect();
    console.log("Connection response:", response);
    
    // Get the wallet address
    const publicKey = response.publicKey.toString();
    
    // Save wallet info to localStorage for persistence
    localStorage.setItem('walletAddress', publicKey);
    localStorage.setItem('walletProvider', 'phantom');
    
    console.log('Successfully connected to Phantom wallet:', publicKey);
    
    return {
      success: true,
      address: publicKey
    };
  } catch (error: any) {
    console.error('Error connecting to Phantom wallet:', error);
    
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
export const getConnectedWallet = (): string | null => {
  try {
    const address = localStorage.getItem('walletAddress');
    const provider = localStorage.getItem('walletProvider');
    
    // Only return the address if it exists and the provider is 'phantom'
    if (address && provider === 'phantom') {
      return address;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting connected wallet:', error);
    return null;
  }
};

/**
 * Disconnect wallet
 * @returns Promise<boolean> - True if disconnected successfully
 */
export const disconnectWallet = async (): Promise<boolean> => {
  try {
    // Clear wallet info from localStorage
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletProvider');
    
    // If Phantom is installed, try to disconnect
    if ((window as any).phantom?.solana?.isPhantom) {
      try {
        // Some wallets provide a disconnect method
        const provider = (window as any).phantom?.solana;
        if (provider.disconnect && typeof provider.disconnect === 'function') {
          await provider.disconnect();
        }
      } catch (error) {
        console.error('Error disconnecting from Phantom wallet:', error);
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
 * Sign a message with Phantom wallet
 * @param message Message to sign
 * @returns Promise with signature result
 */
export const signWithPhantom = async (message: string): Promise<{ success: boolean; signature?: Uint8Array; error?: string }> => {
  try {
    // Check if Phantom is installed
    if (!(window as any).phantom?.solana?.isPhantom) {
      throw new Error('Phantom wallet is not installed');
    }
    
    const provider = (window as any).phantom?.solana;
    
    // Convert message to Uint8Array
    const encodedMessage = new TextEncoder().encode(message);
    
    // Request signature
    const { signature } = await provider.signMessage(encodedMessage, 'utf8');
    
    console.log('Message signed successfully with Phantom wallet');
    
    return {
      success: true,
      signature
    };
  } catch (error: any) {
    console.error('Error signing message with Phantom:', error);
    
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
  return getConnectedWallet() !== null;
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

