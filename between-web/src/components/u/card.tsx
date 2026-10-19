import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>({
  props: {
    className: "rounded-lg border bg-card shadow-sm [&>*:last-child]:mt-0 [&>*:first-child]:rounded-t-lg [&>*:last-child]:rounded-b-lg",
    ...props,
  },
  ref,
});

Card.displayName = "Card";