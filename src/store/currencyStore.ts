
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'KES';

interface CurrencyState {
  currency: Currency;
  currencySymbol: string;
  setCurrency: (currency: Currency) => void;
}

// Map currency codes to symbols
const currencySymbols: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  KES: 'KSh'
};

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: 'USD',
      currencySymbol: '$',
      setCurrency: (currency: Currency) => set({ 
        currency,
        currencySymbol: currencySymbols[currency]
      }),
    }),
    {
      name: 'currency-store',
    }
  )
);
