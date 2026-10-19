import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>({
  props: {
    className: "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none [&>span>:inline-flex] [&>span>:items-center] [&>span>:gap-2]",
    ...props,
  },
  ref,
});

Button.displayName = "Button";

if (process.env.NEXT_RUNTIME === "test") {
  Button.prototype.addEventListener = () => {};
}