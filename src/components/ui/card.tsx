import React from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-surface-raised border border-line",
  elevated: "bg-surface-raised shadow-md border border-line/50",
  subtle: "bg-surface border border-transparent",
  glass: "bg-white/60 backdrop-blur-xl border border-white/30",
};

const sizes = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
  xl: "p-8",
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  hoverable?: boolean;
}

export function Card({
  variant = "default",
  size = "md",
  hoverable = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg transition-all duration-300",
        variants[variant],
        sizes[size],
        hoverable && "hover:shadow-lg hover:border-primary/20 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3 className={cn("text-heading-md font-semibold text-ink", className)} {...props}>
      {children}
    </h3>
  );
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function CardDescription({ className, children, ...props }: CardDescriptionProps) {
  return (
    <p className={cn("text-body-sm text-ink-muted mt-1", className)} {...props}>
      {children}
    </p>
  );
}
