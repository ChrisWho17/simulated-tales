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
          "bg-gradient-to-r from-[#8b5cf6] to-[#d946ef] text-white shadow-[0_0_20px_rgba(139,92,246,0.4),0_4px_15px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6),0_6px_20px_rgba(0,0,0,0.4)] hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] active:shadow-[0_0_15px_rgba(139,92,246,0.4)]",
        destructive:
          "bg-gradient-to-r from-[#ef4444] to-[#f43f5e] text-white shadow-[0_0_20px_rgba(239,68,68,0.4),0_4px_15px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] hover:scale-[1.02] active:scale-[0.98]",
        outline:
          "border border-[rgba(139,92,246,0.5)] bg-transparent text-foreground backdrop-blur-sm hover:bg-[rgba(139,92,246,0.1)] hover:border-[rgba(139,92,246,0.8)] hover:shadow-[0_0_15px_rgba(139,92,246,0.2)]",
        secondary:
          "bg-secondary/80 text-secondary-foreground backdrop-blur-sm border border-border/50 hover:bg-secondary hover:border-primary/30 hover:shadow-glow",
        ghost: 
          "hover:bg-[rgba(139,92,246,0.1)] hover:text-primary",
        link: 
          "text-primary underline-offset-4 hover:underline hover:text-[#d946ef]",
        glow:
          "bg-gradient-to-r from-[#8b5cf6] to-[#d946ef] text-white shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:shadow-[0_0_40px_rgba(139,92,246,0.7)] animate-glow-pulse hover:animate-none hover:scale-[1.02]",
        cyan:
          "bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] text-background shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] hover:scale-[1.02]",
        glass:
          "bg-[rgba(15,15,25,0.7)] backdrop-blur-xl border border-[rgba(139,92,246,0.2)] text-foreground shadow-glass hover:border-[rgba(139,92,246,0.4)] hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]",
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