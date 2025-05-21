import React from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { LucideIcon } from "lucide-react";

interface StrategySliderProps {
  id: string;
  label: string;
  icon: LucideIcon;
  iconColor?: string;
  value: number[];
  onChange: (value: number[]) => void;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  valueDisplay?: string;
  description?: string;
}

const StrategySlider: React.FC<StrategySliderProps> = ({
  id,
  label,
  icon: Icon,
  iconColor = "text-blue-400",
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled = false,
  valueDisplay,
  description
}) => {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <Label htmlFor={id}>{label}</Label>
        </div>
        {valueDisplay && (
          <span className="text-sm font-medium">{valueDisplay}</span>
        )}
      </div>
      <Slider
        id={id}
        value={value}
        onValueChange={onChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="my-1"
      />
      {description && (
        <p className="text-xs text-gray-400">{description}</p>
      )}
    </div>
  );
};

export default StrategySlider;
