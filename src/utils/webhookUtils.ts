
// WebhookUtils.ts - Utility functions for webhook management
import { 
  WebhookConfig, 
  createWebhook, 
  getWebhooks, 
  deleteWebhook 
} from "./apiUtils";

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
