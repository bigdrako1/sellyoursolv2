import React, { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface StrategySectionProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  children: ReactNode;
  className?: string;
}

const StrategySection: React.FC<StrategySectionProps> = ({
  title,
  icon: Icon,
  iconColor = "text-blue-400",
  children,
  className = ""
}) => {
  return (
    <div className={`pt-4 border-t border-white/10 ${className}`}>
      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        {title}
      </h3>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
};

export default StrategySection;
