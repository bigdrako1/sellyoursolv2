
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

/**
 * Detect if Phantom wallet is installed
 * @returns Promise<boolean> - True if Phantom is installed
 */
export const detectPhantomWallet = async (): Promise<boolean> => {
  try {
    // Check if Phantom is installed
    const isPhantomInstalled = (window as any).phantom?.solana?.isPhantom || false;
    
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
    // Check if Phantom is installed
    if (!(window as any).phantom?.solana?.isPhantom) {
      throw new Error('Phantom wallet is not installed');
    }
    
    // Connect to Phantom
    const provider = (window as any).phantom?.solana;
    const { publicKey } = await provider.connect();
    
    // Get the wallet address
    const address = publicKey.toString();
    
    // Save wallet info to localStorage for persistence
    localStorage.setItem('walletAddress', address);
    localStorage.setItem('walletProvider', 'phantom');
    
    return {
      success: true,
      address
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
    return nacl.sign.detached.verify(
      encodedMessage,
      signature,
      pubKey.toBytes()
    );
  } catch (error) {
    console.error('Error verifying wallet signature:', error);
    return false;
  }
};
