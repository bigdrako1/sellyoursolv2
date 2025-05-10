import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = "md", 
  className,
  text
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  };
  
  return (
    <div className="flex flex-col items-center justify-center">
      <Loader2 
        className={cn(
          "animate-spin text-trading-highlight", 
          sizeClasses[size],
          className
        )} 
      />
      {text && (
        <p className="mt-2 text-sm text-gray-400">{text}</p>
      )}
    </div>
  );
};

export const PageSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Spinner size="lg" text="Loading..." />
  </div>
);
