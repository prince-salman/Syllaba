import React from "react";
import { cn } from "@/shared/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-lg cursor-pointer";

    const variants = {
      primary: "bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500 shadow-sm",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-400",
      outline: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus-visible:ring-brand-500",
      ghost: "text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-400",
      danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
    };

    const sizes = {
      sm: "min-h-8 py-1.5 px-3 text-xs gap-1.5",
      md: "min-h-10 py-2 px-4 text-sm gap-2",
      lg: "min-h-12 py-2.5 px-5 text-sm sm:text-base gap-2",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
