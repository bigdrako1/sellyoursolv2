import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LucideIcon } from "lucide-react";

interface StrategyToggleProps {
  id: string;
  label: string;
  icon: LucideIcon;
  iconColor?: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  description?: string;
}

const StrategyToggle: React.FC<StrategyToggleProps> = ({
  id,
  label,
  icon: Icon,
  iconColor = "text-blue-400",
  checked,
  onChange,
  disabled = false,
  description
}) => {
  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <Label htmlFor={id} className="cursor-pointer">{label}</Label>
        </div>
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled}
        />
      </div>
      {description && (
        <p className="text-xs text-gray-400 ml-6">{description}</p>
      )}
    </div>
  );
};

export default StrategyToggle;
