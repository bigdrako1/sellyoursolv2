/**
 * Format a number as currency
 * @param value - The number to format
 * @param currency - The currency code (default: USD)
 * @param minimumFractionDigits - Minimum fraction digits (default: 2)
 * @param maximumFractionDigits - Maximum fraction digits (default: 6)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  value: number,
  currency = 'USD',
  minimumFractionDigits = 2,
  maximumFractionDigits = 6
): string => {
  // Handle small values with appropriate precision
  if (value < 0.01 && value > 0) {
    maximumFractionDigits = 8;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
};

/**
 * Format a number with commas
 * @param value - The number to format
 * @param minimumFractionDigits - Minimum fraction digits (default: 0)
 * @param maximumFractionDigits - Maximum fraction digits (default: 2)
 * @returns Formatted number string
 */
export const formatNumber = (
  value: number,
  minimumFractionDigits = 0,
  maximumFractionDigits = 2
): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
};

/**
 * Format a number as a percentage
 * @param value - The number to format (e.g., 0.25 for 25%)
 * @param minimumFractionDigits - Minimum fraction digits (default: 1)
 * @param maximumFractionDigits - Maximum fraction digits (default: 2)
 * @param includeSign - Whether to include a + sign for positive values (default: true)
 * @returns Formatted percentage string
 */
export const formatPercentage = (
  value: number,
  minimumFractionDigits = 1,
  maximumFractionDigits = 2,
  includeSign = true
): string => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value / 100);

  if (includeSign && value > 0) {
    return `+${formatted}`;
  }

  return formatted;
};

/**
 * Format a date
 * @param date - The date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
};

/**
 * Format a time ago string (e.g., "2 hours ago")
 * @param date - The date to format
 * @returns Formatted time ago string
 */
export const formatTimeAgo = (date: Date | string | number): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
};
