import React, { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Wallet } from "lucide-react";

interface WalletCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

const WalletCard: React.FC<WalletCardProps> = ({ 
  title, 
  children, 
  className = "",
  icon = <Wallet className="h-5 w-5 text-trading-highlight" />
}) => {
  return (
    <Card className={`trading-card card-with-border ${className}`}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            {icon}
            {title}
          </h3>
        </div>
        {children}
      </div>
    </Card>
  );
};

export default WalletCard;
