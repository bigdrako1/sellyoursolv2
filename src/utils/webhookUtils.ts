
// WebhookUtils.ts - Utility functions for webhook management
import { 
  WebhookConfig, 
  createWebhook, 
  getWebhooks, 
  deleteWebhook,
  heliusApiCall
} from "./apiUtils";

// Webhook transaction types
export enum WebhookTransactionType {
  TRANSFER = 'token_transfer',
  NFT_MINT = 'nft_mint',
  NFT_SALE = 'nft_sale',
  NFT_LISTING = 'nft_list',
  SWAP = 'swap',
  ANY = 'transaction'
}

/**
 * Format webhook events for display
 * @param events Array of webhook event types
 * @returns Formatted string of events
 */
export const formatWebhookEvents = (events: string[]): string => {
  if (!events || events.length === 0) return 'No events';
  
  if (events.length === 1) return events[0];
  
  if (events.length === 2) return `${events[0]} and ${events[1]}`;
  
  return `${events.slice(0, -1).join(', ')}, and ${events[events.length - 1]}`;
};

/**
 * Get webhook status text
 * @param active Whether the webhook is active
 * @returns Status text
 */
export const getWebhookStatusText = (active: boolean): string => {
  return active ? 'Active' : 'Inactive';
};

/**
 * Get webhook status color
 * @param active Whether the webhook is active
 * @returns Status color class
 */
export const getWebhookStatusColor = (active: boolean): string => {
  return active ? 'text-trading-success' : 'text-trading-danger';
};

/**
 * Get all available webhook event types
 * @returns Array of event types
 */
export const getWebhookEventTypes = (): string[] => {
  return [
    'transaction',
    'block',
    'token_transfer',
    'nft_mint',
    'nft_sale',
    'nft_list',
    'nft_cancel',
    'token_mint',
    'token_burn',
    'sol_transfer'
  ];
};

/**
 * Create a token transfer webhook
 * @param webhookUrl The URL to send webhook events to
 * @param accountAddresses Array of account addresses to monitor
 * @returns Webhook ID
 */
export const createTokenTransferWebhook = async (webhookUrl: string, accountAddresses: string[]): Promise<string> => {
  try {
    const response = await heliusApiCall('webhooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        webhookURL: webhookUrl,
        transactionTypes: ['token_transfer'],
        accountAddresses: accountAddresses,
        webhookType: 'enhanced'
      })
    });
    
    return response.webhookID;
  } catch (error) {
    console.error("Error creating token transfer webhook:", error);
    throw error;
  }
};

/**
 * Create an NFT activity webhook
 * @param webhookUrl The URL to send webhook events to
 * @param accountAddresses Array of account addresses to monitor
 * @returns Webhook ID
 */
export const createNftActivityWebhook = async (webhookUrl: string, accountAddresses: string[]): Promise<string> => {
  try {
    const response = await heliusApiCall('webhooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        webhookURL: webhookUrl,
        transactionTypes: ['nft_mint', 'nft_sale', 'nft_list', 'nft_cancel'],
        accountAddresses: accountAddresses,
        webhookType: 'enhanced'
      })
    });
    
    return response.webhookID;
  } catch (error) {
    console.error("Error creating NFT activity webhook:", error);
    throw error;
  }
};

/**
 * Create a wallet activity webhook
 * @param webhookUrl The URL to send webhook events to
 * @param accountAddresses Array of account addresses to monitor
 * @param transactionTypes Array of transaction types to monitor
 * @returns Webhook ID
 */
export const createWalletActivityWebhook = async (webhookUrl: string, accountAddresses: string[], transactionTypes: WebhookTransactionType[]): Promise<string> => {
  try {
    const response = await heliusApiCall('webhooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        webhookURL: webhookUrl,
        transactionTypes: transactionTypes,
        accountAddresses: accountAddresses,
        webhookType: 'enhanced'
      })
    });
    
    return response.webhookID;
  } catch (error) {
    console.error("Error creating wallet activity webhook:", error);
    throw error;
  }
};

/**
 * List all webhooks
 * @returns Array of webhooks
 */
export const listWebhooks = async (): Promise<any[]> => {
  try {
    const response = await heliusApiCall('webhooks', {
      method: 'GET'
    });
    
    return response.webhooks || [];
  } catch (error) {
    console.error("Error listing webhooks:", error);
    return [];
  }
};

/**
 * Remove a webhook
 * @param webhookId Webhook ID to remove
 * @returns Success status
 */
export const removeWebhook = async (webhookId: string): Promise<boolean> => {
  try {
    await heliusApiCall(`webhooks/${webhookId}`, {
      method: 'DELETE'
    });
    
    return true;
  } catch (error) {
    console.error(`Error removing webhook ${webhookId}:`, error);
    return false;
  }
};
