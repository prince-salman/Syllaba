import React from "react";
import { cn } from "@/shared/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export function Card({ className, hoverEffect = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm transition-all",
        hoverEffect && "hover:border-brand-300 hover:shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
