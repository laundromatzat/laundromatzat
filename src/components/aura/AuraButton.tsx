/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import clsx from "clsx";

export interface AuraButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant of the button */
  variant?: "primary" | "secondary" | "accent" | "ghost" | "danger";
  /** Size of the button */
  size?: "sm" | "md" | "lg";
  /** Loading state */
  isLoading?: boolean;
  /** Icon to display (before children) */
  icon?: React.ReactNode;
  /** Icon position */
  iconPosition?: "left" | "right";
  /** Full width button */
  fullWidth?: boolean;
}

/**
 * Aura Button Component
 * Premium button with consistent styling, animations, and variants
 */
export const AuraButton = React.forwardRef<HTMLButtonElement, AuraButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      icon,
      iconPosition = "left",
      fullWidth = false,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = clsx(
      // Layout
      "inline-flex items-center justify-center gap-2",
      "font-semibold",
      "rounded-xl",
      "border",
      "relative overflow-hidden",

      // Transitions & Animations
      "aura-transition",
      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-aura-bg",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
      "transform active:scale-[0.98]",

      // Hover effects
      "hover:scale-[1.02]",

      // Full width
      fullWidth && "w-full"
    );

    const sizeStyles = {
      sm: "text-sm px-4 py-2 min-h-[2.25rem]",
      md: "text-base px-5 py-2.5 min-h-[2.75rem]",
      lg: "text-lg px-6 py-3 min-h-[3.25rem]",
    };

    const variantStyles = {
      primary: clsx(
        "bg-aura-text-primary text-white border-aura-text-primary",
        "hover:bg-aura-text-secondary hover:border-aura-text-secondary",
        "focus:ring-aura-text-primary",
        "shadow-aura-md hover:shadow-aura-lg",
        // Gradient overlay on hover
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/10 before:to-white/0",
        "before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
      ),
      secondary: clsx(
        "bg-aura-surface text-aura-text-primary border-aura-border",
        "hover:bg-aura-surface-elevated hover:border-aura-accent",
        "focus:ring-aura-accent",
        "shadow-aura-sm hover:shadow-aura-md"
      ),
      accent: clsx(
        "bg-aura-accent text-aura-text-primary border-aura-accent",
        "hover:bg-aura-accent-hover hover:border-aura-accent-hover",
        "focus:ring-aura-accent",
        "shadow-aura-md hover:shadow-aura-lg hover:shadow-aura-glow"
      ),
      ghost: clsx(
        "bg-transparent text-aura-text-secondary border-transparent",
        "hover:bg-aura-accent-light hover:text-aura-text-primary",
        "focus:ring-aura-accent"
      ),
      danger: clsx(
        "bg-aura-error text-white border-aura-error",
        "hover:bg-timber-700 hover:border-timber-700",
        "focus:ring-aura-error",
        "shadow-aura-md hover:shadow-aura-lg"
      ),
    };

    const LoadingSpinner = () => (
      <svg
        className="animate-spin h-5 w-5"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    const content = (
      <>
        {isLoading && <LoadingSpinner />}
        {!isLoading && icon && iconPosition === "left" && (
          <span className="flex-shrink-0">{icon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && icon && iconPosition === "right" && (
          <span className="flex-shrink-0">{icon}</span>
        )}
      </>
    );

    return (
      <button
        ref={ref}
        className={clsx(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
        disabled={isLoading || disabled}
        {...props}
      >
        {content}
      </button>
    );
  }
);

AuraButton.displayName = "AuraButton";
