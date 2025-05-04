
import { WebhookConfig, createWebhook, getWebhooks, deleteWebhook } from "./apiUtils";

/**
 * Webhook transaction types
 */
export enum WebhookTransactionType {
  ALL = "all",
  ANY = "any",
  NFT_MINT = "NFT_MINT",
  NFT_SALE = "NFT_SALE",
  NFT_LISTING = "NFT_LISTING",
  NFT_CANCEL_LISTING = "NFT_CANCEL_LISTING",
  NFT_SALES_CANCEL = "NFT_SALES_CANCEL",
  NFT_AUCTION_CREATED = "NFT_AUCTION_CREATED",
  NFT_BID = "NFT_BID",
  NFT_AUCTION_CANCELLED = "NFT_AUCTION_CANCELLED",
  NFT_AUCTION_SETTLED = "NFT_AUCTION_SETTLED",
  SWAP = "SWAP",
  TRANSFER = "TRANSFER",
  BURN = "BURN"
}

/**
 * Create a new token transfer webhook
 * @param webhook_url URL to send webhook events to
 * @param token_addresses Array of token addresses to monitor
 * @param auth_header Optional authorization header
 * @returns Webhook ID
 */
export const createTokenTransferWebhook = async (
  webhook_url: string,
  token_addresses: string[],
  auth_header?: string
): Promise<string> => {
  const config: WebhookConfig = {
    webhook_url,
    transaction_types: [WebhookTransactionType.TRANSFER],
    account_addresses: token_addresses,
    webhook_type: "enhanced",
  };
  
  if (auth_header) {
    config.auth_header = auth_header;
  }
  
  const result = await createWebhook(config);
  return result.webhook_id;
};

/**
 * Create a new NFT activity webhook
 * @param webhook_url URL to send webhook events to
 * @param collection_addresses Array of collection addresses to monitor
 * @param auth_header Optional authorization header
 * @returns Webhook ID
 */
export const createNftActivityWebhook = async (
  webhook_url: string,
  collection_addresses: string[],
  auth_header?: string
): Promise<string> => {
  const config: WebhookConfig = {
    webhook_url,
    transaction_types: [
      WebhookTransactionType.NFT_MINT,
      WebhookTransactionType.NFT_SALE,
      WebhookTransactionType.NFT_LISTING,
      WebhookTransactionType.NFT_CANCEL_LISTING
    ],
    account_addresses: collection_addresses,
    webhook_type: "enhanced",
  };
  
  if (auth_header) {
    config.auth_header = auth_header;
  }
  
  const result = await createWebhook(config);
  return result.webhook_id;
};

/**
 * Create a new wallet activity webhook
 * @param webhook_url URL to send webhook events to
 * @param wallet_addresses Array of wallet addresses to monitor
 * @param transaction_types Array of transaction types to monitor
 * @param auth_header Optional authorization header
 * @returns Webhook ID
 */
export const createWalletActivityWebhook = async (
  webhook_url: string,
  wallet_addresses: string[],
  transaction_types: WebhookTransactionType[] = [WebhookTransactionType.ANY],
  auth_header?: string
): Promise<string> => {
  const config: WebhookConfig = {
    webhook_url,
    transaction_types,
    account_addresses: wallet_addresses,
    webhook_type: "enhanced",
  };
  
  if (auth_header) {
    config.auth_header = auth_header;
  }
  
  const result = await createWebhook(config);
  return result.webhook_id;
};

/**
 * Create a Discord notification webhook
 * @param discord_webhook_url Discord webhook URL
 * @param account_addresses Array of addresses to monitor
 * @param transaction_types Array of transaction types to monitor
 * @param username Discord username to use
 * @param avatar_url Discord avatar URL to use
 * @returns Webhook ID
 */
export const createDiscordWebhook = async (
  discord_webhook_url: string,
  account_addresses: string[],
  transaction_types: WebhookTransactionType[] = [WebhookTransactionType.ANY],
  username?: string,
  avatar_url?: string
): Promise<string> => {
  const config: WebhookConfig = {
    webhook_url: discord_webhook_url,
    transaction_types,
    account_addresses,
    webhook_type: "enhanced",
    discord: {
      username,
      avatar_url
    }
  };
  
  const result = await createWebhook(config);
  return result.webhook_id;
};

/**
 * List all active webhooks
 * @returns Array of webhook objects
 */
export const listWebhooks = async (): Promise<any[]> => {
  return await getWebhooks();
};

/**
 * Remove a webhook
 * @param webhookId ID of the webhook to remove
 * @returns Success status
 */
export const removeWebhook = async (webhookId: string): Promise<boolean> => {
  return await deleteWebhook(webhookId);
};
