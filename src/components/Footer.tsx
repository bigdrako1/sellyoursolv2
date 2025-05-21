
import { Activity, Brain, Server, Shield, Clock, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import APP_CONFIG from "@/config/appDefinition";
import LivePriceTracker from "@/components/LivePriceTracker";

interface FooterProps {
  systemActive: boolean;
  systemLatency: number | null;
}

const Footer = ({ systemActive, systemLatency }: FooterProps) => {
  // Get the current year dynamically
  const currentYear = new Date().getFullYear();

  return (
    <footer className="glass-panel py-4 border-t border-white/5 fixed bottom-0 left-0 right-0 z-10 bg-trading-dark shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-400 flex flex-col md:flex-row items-center gap-2">
            <span>© {currentYear} {APP_CONFIG.name} v2. All rights reserved.</span>
            <a href="#" className="text-blue-400 hover:underline hidden md:inline">Terms of Service</a>
            <a href="#" className="text-blue-400 hover:underline hidden md:inline">Privacy Policy</a>
          </div>

          {/* SOL Price Tracker - Center on mobile, inline on desktop */}
          <div className="order-first md:order-none my-3 md:my-0 md:mx-4">
            <LivePriceTracker />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-3 md:mt-0">
            <div className="flex items-center gap-1 text-sm">
              <div className={`w-2 h-2 rounded-full ${systemActive ? 'bg-trading-success' : 'bg-trading-danger'} animate-pulse`}></div>
              <span>{systemActive ? 'System Online' : 'System Offline'}</span>
            </div>

            <div className="flex items-center gap-1 text-sm">
              <Server size={14} className="text-blue-400" />
              <span>
                <Badge variant="outline" className={`${systemActive ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                  {systemActive ? 'Online' : 'Offline'}
                </Badge>
              </span>
            </div>

            <div className="flex items-center gap-1 text-sm">
              <Activity size={14} className="text-trading-highlight" />
              <span>{systemLatency ? `${systemLatency}ms Latency` : 'Not Connected'}</span>
            </div>

            <div className="flex items-center gap-1 text-sm">
              <Brain size={14} className="text-purple-400" />
              <span>AI {systemActive ? 'Active' : 'Standby'}</span>
            </div>

            <div className="flex items-center gap-1 text-sm">
              <Shield size={14} className="text-green-400" />
              <span>Protected</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
