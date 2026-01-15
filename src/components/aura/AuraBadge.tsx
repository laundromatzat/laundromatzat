/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import clsx from "clsx";

export interface AuraBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Visual variant of the badge */
  variant?: "success" | "warning" | "error" | "info" | "neutral";
  /** Size of the badge */
  size?: "sm" | "md" | "lg";
  /** Optional icon */
  icon?: React.ReactNode;
  /** Shape variant */
  shape?: "pill" | "rounded";
  /** Optional dismiss handler */
  onDismiss?: () => void;
}

/**
 * Aura Badge Component
 * Status badge with consistent styling and semantic colors
 */
export const AuraBadge: React.FC<AuraBadgeProps> = ({
  children,
  variant = "neutral",
  size = "md",
  icon,
  shape = "pill",
  onDismiss,
  className = "",
  ...props
}) => {
  const baseStyles = clsx(
    "inline-flex items-center gap-1.5",
    "font-semibold",
    "border",
    "aura-transition",
    shape === "pill" ? "rounded-full" : "rounded-lg"
  );

  const sizeStyles = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const variantStyles = {
    success: clsx(
      "bg-aura-success-light text-aura-success",
      "border-aura-success/20"
    ),
    warning: clsx(
      "bg-aura-warning-light text-aura-warning",
      "border-aura-warning/20"
    ),
    error: clsx("bg-aura-error-light text-aura-error", "border-aura-error/20"),
    info: clsx("bg-aura-info-light text-aura-info", "border-aura-info/20"),
    neutral: clsx(
      "bg-aura-accent-light text-aura-text-primary",
      "border-aura-border"
    ),
  };

  return (
    <span
      className={clsx(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children && <span>{children}</span>}
      {onDismiss && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className={clsx(
            "flex-shrink-0 ml-0.5 rounded-full",
            "hover:bg-black/10",
            "focus:outline-none focus:ring-1 focus:ring-current",
            "aura-transition-fast"
          )}
          aria-label="Dismiss"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  );
};

AuraBadge.displayName = "AuraBadge";
