import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  asChild?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>({
  props: {
    className: "prim-500 peer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer [&>span]:pointer-events-none [&>span]:flex [&>span]:items-center [&>span]:gap-2",
    ...props,
  },
  ref,
});

Checkbox.displayName = "Checkbox";