import { cn } from "@/lib/utils";

export interface ToggleProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export const Toggle = React.forwardRef<HTMLDivElement, ToggleProps>({
  props: {
    className: "relative flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:block [&>span]:rounded-full [&>span]:w-3 [&>span]:h-3 [&>span]:bg-background [&>span]:transition-colors [&>span]:focus-visible:outline-none [&>span]:focus-visible:ring-2 [&>span]:focus-visible:ring-2 [&>span]:focus-visible:ring-offset-2",
    ...props,
  },
  ref,
});

Toggle.displayName = "Toggle";