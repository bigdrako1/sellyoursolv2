
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CoinbaseWalletAdapter,
} from "@solana/wallet-adapter-wallets";

import { Connection, PublicKey } from "@solana/web3.js";
import { sign } from "tweetnacl";
import bs58 from "bs58"; // Using correct import syntax

export type WalletError = Error & { name: string; message: string };
export type SignMessageError = WalletError & { name: string; message: string };

export interface WalletProviderInfo {
  name: string;
  installed: boolean;
  icon?: string;
  url?: string; // Added url property
  canLoad: boolean;
  adapter?: any;
}

// State for connected wallet
let connectedWalletAddress: string | null = null;
let connectedWalletProvider: string | null = null;
let currentWalletAdapter: any = null;

// Function to format wallet address
export const formatWalletAddress = (address: string): string => {
  if (!address) return '';
  return address.length > 8 ? `${address.slice(0, 4)}...${address.slice(-4)}` : address;
};

// Function to detect available wallets
export const detectWallets = async (): Promise<{
  available: boolean;
  installedWallets: WalletProviderInfo[];
  loadableWallets: WalletProviderInfo[];
}> => {
  try {
    // Create wallet adapters for various providers
    const walletAdapters = [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new CoinbaseWalletAdapter(),
      // Removed unsupported wallet adapters
    ];

    // Check which wallets are installed/available
    const installedWallets: WalletProviderInfo[] = [];
    const loadableWallets: WalletProviderInfo[] = [];

    for (const adapter of walletAdapters) {
      const walletInfo: WalletProviderInfo = {
        name: adapter.name,
        installed: adapter.readyState === "Installed",
        canLoad: adapter.readyState !== "Unsupported",
        url: `https://solana.com/ecosystem/wallets/${adapter.name.toLowerCase().replace(/\s+/g, '-')}`,
        adapter: adapter
      };

      if (walletInfo.installed) {
        installedWallets.push(walletInfo);
      } else if (walletInfo.canLoad) {
        loadableWallets.push(walletInfo);
      }
    }

    return {
      available: installedWallets.length > 0,
      installedWallets,
      loadableWallets
    };
  } catch (error) {
    console.error("Error detecting wallets:", error);
    return {
      available: false,
      installedWallets: [],
      loadableWallets: []
    };
  }
};

// Connect to wallet
export const connectWallet = async (walletName: string): Promise<{
  success: boolean;
  address?: string;
  error?: string;
  walletName?: string;
}> => {
  try {
    console.log(`connectWallet called with wallet name: ${walletName}`);

    // Get the list of available wallets
    console.log("Detecting available wallets...");
    const { installedWallets } = await detectWallets();
    console.log("Installed wallets:", installedWallets);

    // Find the requested wallet adapter
    console.log(`Looking for wallet adapter for: ${walletName}`);
    const walletInfo = installedWallets.find(
      wallet => wallet.name.toLowerCase() === walletName.toLowerCase()
    );
    console.log("Found wallet info:", walletInfo);

    if (!walletInfo || !walletInfo.adapter) {
      console.error(`Wallet ${walletName} not found or not installed`);
      return {
        success: false,
        error: `Wallet ${walletName} not found or not installed`
      };
    }

    const adapter = walletInfo.adapter;
    console.log("Using adapter:", adapter.name, "Ready state:", adapter.readyState);

    // Prepare adapter
    if (!adapter.connected) {
      console.log("Adapter not connected, connecting...");
      await adapter.connect();
      console.log("Adapter connect() called");
    } else {
      console.log("Adapter already connected");
    }

    // Check if connection was successful
    console.log("Checking connection status - connected:", adapter.connected, "publicKey:", adapter.publicKey);
    if (!adapter.connected || !adapter.publicKey) {
      console.error("Failed to connect to wallet - adapter connected:", adapter.connected, "publicKey:", adapter.publicKey);
      return {
        success: false,
        error: "Failed to connect to wallet"
      };
    }

    // Store connection state
    connectedWalletAddress = adapter.publicKey.toString();
    connectedWalletProvider = walletName;
    currentWalletAdapter = adapter;
    console.log("Connection state stored - address:", connectedWalletAddress, "provider:", connectedWalletProvider);

    // Store in localStorage for persistence
    localStorage.setItem('walletAddress', connectedWalletAddress);
    localStorage.setItem('walletProvider', connectedWalletProvider);
    console.log("Connection state saved to localStorage");

    return {
      success: true,
      address: connectedWalletAddress,
      walletName: walletName
    };
  } catch (error) {
    console.error("Error connecting to wallet:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error connecting to wallet"
    };
  }
};

// Disconnect from wallet
export const disconnectWallet = async (): Promise<boolean> => {
  try {
    if (currentWalletAdapter && currentWalletAdapter.connected) {
      await currentWalletAdapter.disconnect();
    }

    // Clear connection state
    connectedWalletAddress = null;
    connectedWalletProvider = null;
    currentWalletAdapter = null;

    // Remove from localStorage
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletProvider');

    return true;
  } catch (error) {
    console.error("Error disconnecting wallet:", error);
    return false;
  }
};

// Get connected wallet
export const getConnectedWallet = (): {
  address: string | null;
  provider: string | null;
} => {
  if (!connectedWalletAddress || !connectedWalletProvider) {
    // Try to recover from localStorage
    connectedWalletAddress = localStorage.getItem('walletAddress');
    connectedWalletProvider = localStorage.getItem('walletProvider');
  }

  return {
    address: connectedWalletAddress,
    provider: connectedWalletProvider
  };
};

// Sign message with wallet
export const signMessage = async (message: string): Promise<{
  success: boolean;
  signature?: Uint8Array;
  error?: string;
}> => {
  try {
    console.log("signMessage called with message:", message);
    console.log("Current wallet adapter:", currentWalletAdapter);

    if (!currentWalletAdapter || !currentWalletAdapter.connected) {
      console.error("Wallet not connected - adapter:", currentWalletAdapter,
                   "connected:", currentWalletAdapter?.connected);
      return {
        success: false,
        error: "Wallet not connected"
      };
    }

    console.log("Wallet adapter ready for signing - name:", currentWalletAdapter.name,
               "connected:", currentWalletAdapter.connected,
               "publicKey:", currentWalletAdapter.publicKey?.toString());

    // Encode message to Uint8Array
    const encodedMessage = new TextEncoder().encode(message);
    console.log("Message encoded to Uint8Array, length:", encodedMessage.length);

    // Check if adapter has signMessage method
    if (typeof currentWalletAdapter.signMessage !== 'function') {
      console.error("Wallet adapter does not support signMessage method");
      return {
        success: false,
        error: "Wallet does not support message signing"
      };
    }

    console.log("Calling wallet adapter signMessage method...");
    // Sign message with type assertion to ensure it can call signMessage
    const signature = await (currentWalletAdapter as any).signMessage(encodedMessage);
    console.log("Signature received:", signature);

    return {
      success: true,
      signature
    };
  } catch (error) {
    console.error("Error signing message:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during signature"
    };
  }
};

// Verify wallet signature
export const verifyWalletSignature = async (
  publicKeyStr: string,
  message: string,
  signature: Uint8Array
): Promise<boolean> => {
  try {
    const publicKey = new PublicKey(publicKeyStr);
    const encodedMessage = new TextEncoder().encode(message);

    return sign.detached.verify(
      encodedMessage,
      signature,
      publicKey.toBytes()
    );
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
};
