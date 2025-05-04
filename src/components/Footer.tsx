
import { Activity, Brain } from "lucide-react";

interface FooterProps {
  systemActive: boolean;
  systemLatency: number | null;
}

const Footer = ({ systemActive, systemLatency }: FooterProps) => {
  return (
    <footer className="glass-panel py-4 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-400">
            © 2024 SellYourSOL V2 AI. All rights reserved.
          </div>
          <div className="flex items-center gap-4 mt-2 md:mt-0">
            <div className="flex items-center gap-1 text-sm">
              <div className={`w-2 h-2 rounded-full ${systemActive ? 'bg-trading-success' : 'bg-trading-danger'}`}></div>
              <span>{systemActive ? 'System Online' : 'System Offline'}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Activity size={14} className="text-trading-highlight" />
              <span>{systemLatency ? `${systemLatency}ms Latency` : 'Not Connected'}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Brain size={14} className="text-purple-400" />
              <span>AI {systemActive ? 'Active' : 'Standby'}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
