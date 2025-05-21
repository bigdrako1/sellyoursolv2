import React, { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface SmartMoneyCardProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  children: ReactNode;
  className?: string;
}

const SmartMoneyCard: React.FC<SmartMoneyCardProps> = ({
  title,
  icon: Icon,
  iconColor = "text-blue-400",
  children,
  className = ""
}) => {
  return (
    <Card className={`card-with-border ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

export default SmartMoneyCard;
