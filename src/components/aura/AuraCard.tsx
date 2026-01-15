/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import clsx from "clsx";

export interface AuraCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual variant of the card */
  variant?: "elevated" | "glass" | "bordered" | "interactive";
  /** Padding size */
  padding?: "sm" | "md" | "lg" | "none";
  /** Optional gradient top border */
  gradientTop?: boolean;
  /** Make card clickable/hoverable */
  interactive?: boolean;
  /** Optional click handler (automatically makes card interactive) */
  onClick?: () => void;
}

/**
 * Aura Card Component
 * Premium card container with consistent styling and variants
 */
export const AuraCard = React.forwardRef<HTMLDivElement, AuraCardProps>(
  (
    {
      children,
      variant = "elevated",
      padding = "md",
      gradientTop = false,
      interactive = false,
      onClick,
      className = "",
      ...props
    },
    ref
  ) => {
    const isInteractive = interactive || !!onClick;

    const baseStyles = clsx(
      "rounded-xl",
      "aura-transition",
      "relative",
      gradientTop && "overflow-hidden"
    );

    const paddingStyles = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };

    const variantStyles = {
      elevated: clsx(
        "bg-aura-surface",
        "border border-aura-border",
        "shadow-aura-sm",
        isInteractive &&
          "hover:shadow-aura-md hover:-translate-y-0.5 cursor-pointer"
      ),
      glass: clsx(
        "aura-glass",
        "shadow-aura-md",
        isInteractive &&
          "hover:shadow-aura-lg hover:-translate-y-0.5 cursor-pointer"
      ),
      bordered: clsx(
        "bg-aura-surface",
        "border-2 border-aura-border",
        isInteractive && "hover:border-aura-accent cursor-pointer"
      ),
      interactive: clsx(
        "bg-aura-surface",
        "border border-aura-border",
        "shadow-aura-sm",
        "hover:shadow-aura-lg hover:border-aura-accent hover:-translate-y-1",
        "cursor-pointer"
      ),
    };

    return (
      <div
        ref={ref}
        className={clsx(
          baseStyles,
          paddingStyles[padding],
          variantStyles[variant],
          className
        )}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        {...props}
      >
        {gradientTop && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-aura-text-primary via-aura-accent to-aura-text-primary" />
        )}
        {children}
      </div>
    );
  }
);

AuraCard.displayName = "AuraCard";
