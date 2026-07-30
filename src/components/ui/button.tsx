import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold font-body ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: 
          "bg-[image:var(--accent-gradient)] text-white shadow-[0_0_12px_var(--accent-glow),0_4px_15px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.18)] hover:shadow-[0_0_18px_var(--accent-glow-intense),0_6px_20px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 active:scale-[0.98]",
        destructive:
          "bg-gradient-to-r from-[#ef4444] to-[#f43f5e] text-white shadow-[0_0_20px_rgba(239,68,68,0.4),0_4px_15px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] hover:scale-[1.02] active:scale-[0.98]",
        outline:
          "border border-[var(--accent-border)] bg-transparent text-foreground backdrop-blur-sm hover:bg-[var(--accent-bg)] hover:border-[var(--accent-primary)]",
        secondary:
          "bg-secondary/80 text-secondary-foreground backdrop-blur-sm border border-border/50 hover:bg-secondary hover:border-primary/30 hover:shadow-glow",
        ghost: 
          "hover:bg-[var(--accent-bg)] hover:text-primary",
        link: 
          "text-primary underline-offset-4 hover:underline hover:text-[var(--accent-secondary)]",
        glow:
          "bg-[image:var(--accent-gradient)] text-white shadow-[0_0_16px_var(--accent-glow)] hover:shadow-[0_0_24px_var(--accent-glow-intense)] animate-glow-pulse hover:animate-none hover:scale-[1.01]",
        cyan:
          "bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] text-background shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] hover:scale-[1.02]",
        glass:
          "bg-[rgba(15,15,25,0.7)] backdrop-blur-xl border border-[var(--accent-border)] text-foreground shadow-glass hover:border-[var(--accent-primary)] hover:shadow-[0_0_14px_var(--accent-glow)]",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp 
        className={cn(buttonVariants({ variant, size, className }))} 
        ref={ref} 
        {...props} 
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };