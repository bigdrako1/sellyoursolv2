
import { heliusApiCall } from './apiUtils';

// WebhookConfig interface for type safety
export interface WebhookConfig {
  id?: string;
  name: string;
  description?: string;
  url: string;
  accountAddresses?: string[];
  webhookType: 'enhanced' | 'transaction' | 'account';
  transactionTypes?: string[];
  accountAddressTransactions?: boolean;
  webhookURL?: string;
}

// WebhookTransactionType enum for type safety
export enum WebhookTransactionType {
  TOKEN_TRANSFER = 'TOKEN_TRANSFER',
  TOKEN_CREATE = 'TOKEN_CREATE',
  TOKEN_MINT = 'TOKEN_MINT',
  NFT_SALE = 'NFT_SALE',
  NFT_LISTING = 'NFT_LISTING',
  NFT_MINT = 'NFT_MINT',
  SWAP = 'SWAP'
}

/**
 * Creates a new webhook
 * @param config Webhook configuration
 * @returns Created webhook data
 */
export const createWebhook = async (config: WebhookConfig): Promise<any> => {
  try {
    // In real implementation, this would call Helius API to create a webhook
    // For now we simulate the response
    return {
      id: 'webhook_' + Date.now(),
      ...config,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error creating webhook:', error);
    throw error;
  }
};

/**
 * Creates a token transfer webhook
 * @param name Webhook name
 * @param url Webhook URL
 * @param accountAddresses Account addresses to monitor
 * @returns Created webhook data
 */
export const createTokenTransferWebhook = async (
  name: string, 
  url: string,
  accountAddresses: string[]
): Promise<any> => {
  return createWebhook({
    name,
    url,
    accountAddresses,
    webhookType: 'enhanced',
    transactionTypes: [WebhookTransactionType.TOKEN_TRANSFER]
  });
};

/**
 * Creates an NFT activity webhook
 * @param name Webhook name
 * @param url Webhook URL
 * @param accountAddresses Account addresses to monitor
 * @returns Created webhook data
 */
export const createNftActivityWebhook = async (
  name: string,
  url: string,
  accountAddresses: string[]
): Promise<any> => {
  return createWebhook({
    name,
    url,
    accountAddresses,
    webhookType: 'enhanced',
    transactionTypes: [
      WebhookTransactionType.NFT_SALE,
      WebhookTransactionType.NFT_LISTING,
      WebhookTransactionType.NFT_MINT
    ]
  });
};

/**
 * Creates a wallet activity webhook
 * @param name Webhook name
 * @param url Webhook URL
 * @param accountAddresses Account addresses to monitor
 * @returns Created webhook data
 */
export const createWalletActivityWebhook = async (
  name: string,
  url: string,
  accountAddresses: string[]
): Promise<any> => {
  return createWebhook({
    name,
    url,
    accountAddresses,
    webhookType: 'account',
    accountAddressTransactions: true
  });
};

/**
 * Get list of webhooks
 * @returns List of webhooks
 */
export const getWebhooks = async (): Promise<WebhookConfig[]> => {
  try {
    // In real implementation, this would call Helius API to get webhooks
    // For now we return mock data
    return [
      {
        id: 'webhook_1',
        name: 'Smart Money Tracking',
        description: 'Track transactions from known smart money wallets',
        url: 'https://your-server.com/webhook/smart-money',
        webhookType: 'enhanced',
        accountAddresses: [
          'B8oMRGgLETGQcksXBawvTDXvr5NLKX1jsBL2bAhXHyQT',
          'DWkZXkZKuqeM1aM991Kz6BVLuGgzWEyK9K4YqgJV6EEU'
        ]
      },
      {
        id: 'webhook_2',
        name: 'New Token Monitoring',
        description: 'Monitor for new token creations',
        url: 'https://your-server.com/webhook/new-tokens',
        webhookType: 'transaction',
        transactionTypes: ['TOKEN_CREATE', 'TOKEN_MINT']
      }
    ];
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return [];
  }
};

/**
 * Get webhooks for a specific wallet
 * @param address Wallet address
 * @returns List of webhooks for the wallet
 */
export const listWebhooks = async (address?: string): Promise<WebhookConfig[]> => {
  const webhooks = await getWebhooks();
  
  if (!address) {
    return webhooks;
  }
  
  return webhooks.filter(webhook => 
    webhook.accountAddresses?.includes(address)
  );
};

/**
 * Delete a webhook
 * @param webhookId ID of the webhook to delete
 * @returns Success status
 */
export const removeWebhook = async (webhookId: string): Promise<boolean> => {
  try {
    // In real implementation, this would call Helius API to delete a webhook
    // For now we just return success
    return true;
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return false;
  }
};
