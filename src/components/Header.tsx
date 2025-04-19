
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LivePriceTracker from "./LivePriceTracker";
import { 
  ChevronDown, 
  BarChart2, 
  Zap, 
  Settings, 
  Bell, 
  CircleDollarSign, 
  Shield,
  Volume2,
  VolumeX
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { playSound, toggleMute } from "@/utils/soundUtils";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  walletAddress?: string;
}

const Header = ({ walletAddress }: HeaderProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMuted, setIsMuted] = useState(false);
  const location = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    toggleMute(!isMuted);
    toast({
      title: !isMuted ? "Sound disabled" : "Sound enabled",
      description: !isMuted ? "Notifications will be silent" : "Notifications will play sounds",
    });
  };
  
  return (
    <header className="glass-panel sticky top-0 z-50 p-4 mb-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-blue-500 opacity-50 animate-pulse-glow"></div>
            <CircleDollarSign className="w-6 h-6 text-white z-10" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight trading-gradient-text">SellYourSOL™ v2</h1>
          
          <div className="hidden md:flex ml-6 space-x-1">
            <Link to="/">
              <Button 
                variant={location.pathname === "/" ? "default" : "ghost"} 
                className="flex items-center text-sm"
              >
                Dashboard
              </Button>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center text-sm">
                  Trading <ChevronDown size={14} className="ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-trading-darkAccent border-white/5">
                <Link to="/market-analysis">
                  <DropdownMenuItem>
                    <BarChart2 size={14} className="mr-2" /> Market Analysis
                  </DropdownMenuItem>
                </Link>
                <Link to="/auto-trading">
                  <DropdownMenuItem>
                    <Zap size={14} className="mr-2" /> Auto Trading
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Link to="/portfolio">
              <Button 
                variant={location.pathname === "/portfolio" ? "default" : "ghost"} 
                className="flex items-center text-sm"
              >
                Portfolio
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <LivePriceTracker />
          
          <div className="hidden md:block text-sm text-gray-400">
            <span className="font-medium">{formatTime(currentTime)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
              onClick={handleMuteToggle}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </Button>
            
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell size={18} />
            </Button>
            
            <Link to="/settings">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Settings size={18} />
              </Button>
            </Link>
            
            {walletAddress && (
              <div className="hidden md:flex items-center gap-2 py-1 px-3 rounded-full bg-trading-highlight/10 border border-trading-highlight/30">
                <Shield size={14} className="text-trading-highlight" />
                <span className="text-sm font-medium truncate max-w-[100px]">{walletAddress}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
