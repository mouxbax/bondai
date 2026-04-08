import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#1D9E75]/10 text-[#0f6b4f] dark:bg-[#1D9E75]/20 dark:text-emerald-200",
        secondary: "border-transparent bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100",
        outline: "text-stone-700 dark:text-stone-200",
        amber: "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
