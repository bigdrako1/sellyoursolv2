import React, { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StrategyCardProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}

const StrategyCard: React.FC<StrategyCardProps> = ({
  title,
  icon: Icon,
  iconColor = "text-blue-400",
  children,
  className = "",
  headerAction
}) => {
  return (
    <Card className={`trading-card card-with-border ${className}`}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Icon className={`h-5 w-5 ${iconColor}`} />
            {title}
          </h3>
          {headerAction}
        </div>
        {children}
      </div>
    </Card>
  );
};

export default StrategyCard;
