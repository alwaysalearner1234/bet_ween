import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "filled";
  size?: "default" | "sm" | "lg";
  asChild?: boolean;
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants = {
      default: "border border-input bg-background",
      outline: "border border-input bg-background",
      filled: "bg-primary text-primary-foreground",
    };
    
    const sizes = {
      default: "px-3 py-1.5 text-sm",
      sm: "px-2.5 py-1 text-xs",
      lg: "px-4 py-2 text-base",
    };

    return (
      <button
        className={cn(
          "inline-flex items-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Chip.displayName = "Chip";