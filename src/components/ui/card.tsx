import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-[rgba(139,92,246,0.2)] bg-[rgba(15,15,25,0.7)] backdrop-blur-xl text-card-foreground shadow-glass transition-all duration-300",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardInteractive = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-[rgba(139,92,246,0.2)] bg-[rgba(15,15,25,0.7)] backdrop-blur-xl text-card-foreground shadow-glass transition-all duration-300 cursor-pointer",
        "hover:border-[rgba(139,92,246,0.4)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_20px_rgba(139,92,246,0.3)] hover:-translate-y-1",
        className
      )}
      {...props}
    />
  )
);
CardInteractive.displayName = "CardInteractive";

const CardGradientBorder = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative group">
      <div
        className={cn(
          "absolute -inset-[2px] rounded-[18px] bg-gradient-to-r from-[#8b5cf6] via-[#d946ef] to-[#22d3ee] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm",
        )}
      />
      <div
        ref={ref}
        className={cn(
          "relative rounded-2xl border border-[rgba(139,92,246,0.2)] bg-[rgba(15,15,25,0.9)] backdrop-blur-xl text-card-foreground shadow-glass transition-all duration-300",
          className
        )}
        {...props}
      />
    </div>
  )
);
CardGradientBorder.displayName = "CardGradientBorder";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 
      ref={ref} 
      className={cn(
        "text-2xl font-semibold leading-none tracking-wide font-display text-gradient-primary",
        className
      )} 
      {...props} 
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground leading-relaxed", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardInteractive, CardGradientBorder, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };