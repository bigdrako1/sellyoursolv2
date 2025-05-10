
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CurrencySelector from "@/components/CurrencySelector";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import LivePriceTracker from "@/components/LivePriceTracker";
import AppNavigation, { MobileNavigation } from "@/components/AppNavigation";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <header className="bg-trading-darkAccent border-b border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and navigation */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-xl font-bold text-trading-highlight">SellYourSOL V2</Link>
            <AppNavigation />
          </div>
          
          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block">
              <LivePriceTracker />
            </div>
            <CurrencySelector />
            
            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              className="md:hidden" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              size="icon"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-trading-darkAccent border-t border-white/5">
          <div className="container mx-auto px-4 py-2">
            <MobileNavigation />
            <div className="mt-3 pt-2 border-t border-white/10">
              <LivePriceTracker />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
