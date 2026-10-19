import { cn } from "@/lib/utils";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "filled";
  size?: "default" | "sm" | "lg";
  asChild?: boolean;
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>({
  props: {
    className: "inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:items-center [&>span]:gap-1",
    ...props,
  },
  ref,
});

Chip.displayName = "Chip";