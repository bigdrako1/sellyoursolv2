
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'KES';

interface CurrencyState {
  currency: Currency;
  currencySymbol: string;
  setCurrency: (currency: Currency | string) => void;
}

// Map currency codes to symbols
const currencySymbols: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  KES: 'KSh'
};

// Function to validate currency string
const validateCurrency = (currency: string): Currency => {
  if (currency === 'USD' || currency === 'EUR' || currency === 'GBP' || currency === 'JPY' || currency === 'KES') {
    return currency as Currency;
  }
  return 'USD'; // Default fallback
};

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: 'USD',
      currencySymbol: '$',
      setCurrency: (currency: Currency | string) => {
        const validatedCurrency = typeof currency === 'string' ? validateCurrency(currency) : currency;
        set({ 
          currency: validatedCurrency,
          currencySymbol: currencySymbols[validatedCurrency]
        });
      },
    }),
    {
      name: 'currency-store',
    }
  )
);
