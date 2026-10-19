import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  asChild?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>({
  props: {
    className: "block w-full rounded-md border input-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    ...props,
  },
  ref,
});

Input.displayName = "Input";