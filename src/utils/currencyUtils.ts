import { Currency } from '@/store/currencyStore';

// Exchange rates for different currencies (relative to USD)
export const CURRENCY_RATES: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 150.56,
  KES: 129.45
};

/**
 * Converts a USD value to the specified currency
 * @param value The value in USD to convert
 * @param currency The target currency to convert to
 * @returns The converted value in the target currency
 */
export const convertUsdToCurrency = (value: number, currency: Currency | string): number => {
  // Validate the currency
  const validCurrency = currency as Currency;
  
  // Get the exchange rate for the currency
  const rate = CURRENCY_RATES[validCurrency];
  
  // If the rate is undefined, log a warning and return the original value
  if (rate === undefined) {
    console.warn(`No exchange rate found for ${currency}, using USD rate`);
    return value;
  }
  
  // Multiply the value by the exchange rate
  return value * rate;
};

/**
 * Formats a currency value with the appropriate symbol and decimal places
 * @param value The value to format
 * @param currency The currency code
 * @param symbol The currency symbol
 * @param options Formatting options
 * @returns Formatted currency string
 */
export const formatCurrency = (
  value: number, 
  currency: Currency | string, 
  symbol: string,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    useGrouping?: boolean;
  } = {}
): string => {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    useGrouping = true
  } = options;
  
  // Convert the value to the target currency
  const convertedValue = convertUsdToCurrency(value, currency);
  
  // Format the value using Intl.NumberFormat
  const formattedValue = new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping
  }).format(convertedValue);
  
  // Return the formatted value with the currency symbol
  return `${symbol}${formattedValue}`;
};
