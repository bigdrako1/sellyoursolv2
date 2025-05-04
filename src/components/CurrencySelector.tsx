
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CircleDollarSign } from "lucide-react";
import { useCurrencyStore } from "@/store/currencyStore";

const CurrencySelector = () => {
  const { currency, currencySymbol, setCurrency } = useCurrencyStore();

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="bg-trading-darkAccent border-white/10 hover:bg-white/10">
          <CircleDollarSign className="mr-2 h-4 w-4 text-trading-highlight" />
          <span>{currencySymbol} {currency}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-trading-darkAccent border-white/10">
        {currencies.map((curr) => (
          <DropdownMenuItem
            key={curr.code}
            onClick={() => setCurrency(curr.code as any)}
            className={`cursor-pointer ${currency === curr.code ? 'bg-trading-highlight/20' : ''}`}
          >
            <span className="mr-2">{curr.symbol}</span>
            {curr.name} ({curr.code})
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CurrencySelector;
