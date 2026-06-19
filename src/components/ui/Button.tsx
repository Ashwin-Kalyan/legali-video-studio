"use client";

import { cn } from "@/lib/utils";

type Variant = "primary" | "pink" | "ghost" | "outline" | "dark";
type Size = "sm" | "md";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-white border border-accent hover:bg-[#6d28d9] shadow-sm",
  pink: "bg-pink text-white border border-pink hover:opacity-90 shadow-sm",
  ghost: "bg-transparent text-secondary hover:bg-surface-2 border border-transparent",
  outline:
    "bg-surface text-ink border border-rule hover:bg-surface-2 hover:border-accent/40",
  dark: "bg-ink text-paper border border-ink hover:bg-[#211c26]",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
};

export function Button({
  variant = "outline",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
