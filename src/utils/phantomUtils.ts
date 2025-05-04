
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
