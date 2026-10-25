import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToggleProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export const Toggle = React.forwardRef<HTMLDivElement, ToggleProps>(
  ({ className, ...props }, ref) => (
    <div
      className={cn("relative flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)}
      ref={ref}
      {...props}
    >
      <span className="block h-3 w-3 rounded-full bg-background shadow-lg transition-transform" />
    </div>
  )
);

Toggle.displayName = "Toggle";