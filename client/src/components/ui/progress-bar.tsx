import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ value, max = 100, className, indicatorClassName, ...props }, ref) => {
    const percentage = (value / max) * 100;
    
    return (
      <div
        ref={ref}
        className={cn("w-full bg-gray-200 rounded-full h-2", className)}
        {...props}
      >
        <div
          className={cn("bg-[#2C5282] rounded-full h-2", indicatorClassName)}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";

export default ProgressBar;
