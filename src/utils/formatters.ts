/**
 * Utility functions for formatting values
 */

/**
 * Format a number as currency
 * @param value Number to format
 * @param currency Currency code (default: USD)
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  value: number,
  currency: string = 'USD',
  decimals: number = 2
): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

/**
 * Format a number as percentage
 * @param value Number to format (e.g., 0.15 for 15%)
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted percentage string
 */
export const formatPercent = (
  value: number,
  decimals: number = 2
): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
};

/**
 * Format a number with thousands separators
 * @param value Number to format
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted number string
 */
export const formatNumber = (
  value: number,
  decimals: number = 2
): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

/**
 * Format a date string
 * @param dateString Date string to format
 * @param format Format style (default: 'medium')
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string,
  format: 'short' | 'medium' | 'long' = 'medium'
): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: format
  }).format(date);
};

/**
 * Format a time duration in milliseconds
 * @param ms Time in milliseconds
 * @returns Formatted duration string (e.g., "2h 30m")
 */
export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  
  return `${seconds}s`;
};

/**
 * Format a large number with abbreviations (K, M, B)
 * @param value Number to format
 * @param decimals Number of decimal places (default: 1)
 * @returns Formatted abbreviated number
 */
export const formatCompactNumber = (
  value: number,
  decimals: number = 1
): string => {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

/**
 * Format a token amount based on decimals
 * @param amount Token amount in smallest unit
 * @param decimals Token decimals
 * @returns Formatted token amount
 */
export const formatTokenAmount = (
  amount: number | string,
  decimals: number = 9
): string => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  const divisor = Math.pow(10, decimals);
  const formattedValue = value / divisor;
  
  if (formattedValue < 0.001) {
    return formattedValue.toExponential(2);
  }
  
  return formatNumber(formattedValue, formattedValue < 1 ? 6 : 2);
};

/**
 * Format a wallet address for display
 * @param address Wallet address
 * @param prefixLength Number of characters to show at start (default: 4)
 * @param suffixLength Number of characters to show at end (default: 4)
 * @returns Shortened address
 */
export const formatAddress = (
  address: string,
  prefixLength: number = 4,
  suffixLength: number = 4
): string => {
  if (!address || address.length < (prefixLength + suffixLength + 3)) {
    return address || '';
  }
  
  const prefix = address.substring(0, prefixLength);
  const suffix = address.substring(address.length - suffixLength);
  
  return `${prefix}...${suffix}`;
};
