/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId } from "react";
import clsx from "clsx";

export interface AuraInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>,
    "size"
  > {
  /** Label text */
  label?: string;
  /** Error message */
  error?: string;
  /** Success message */
  success?: string;
  /** Helper text */
  helperText?: string;
  /** Input type */
  inputType?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "tel"
    | "url"
    | "textarea";
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Optional icon (prefix) */
  prefixIcon?: React.ReactNode;
  /** Optional icon (suffix) */
  suffixIcon?: React.ReactNode;
  /** Full width input */
  fullWidth?: boolean;
  /** Textarea rows (only for textarea type) */
  rows?: number;
}

/**
 * Aura Input Component
 * Premium form input with consistent styling and validation states
 */
export const AuraInput = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  AuraInputProps
>(
  (
    {
      label,
      error,
      success,
      helperText,
      inputType = "text",
      size = "md",
      prefixIcon,
      suffixIcon,
      fullWidth = false,
      rows = 4,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = useId();
    const errorId = useId();
    const helperId = useId();

    const hasError = !!error;
    const hasSuccess = !!success;

    const baseStyles = clsx(
      "block w-full",
      "bg-aura-surface",
      "border",
      "rounded-lg",
      "text-aura-text-primary placeholder-aura-text-tertiary",
      "aura-transition",
      "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-aura-bg",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-aura-bg"
    );

    const sizeStyles = {
      sm: "text-sm px-3 py-2",
      md: "text-base px-4 py-2.5",
      lg: "text-lg px-5 py-3",
    };

    const stateStyles = clsx(
      hasError && [
        "border-aura-error",
        "focus:border-aura-error",
        "focus:ring-aura-error/30",
      ],
      hasSuccess && [
        "border-aura-success",
        "focus:border-aura-success",
        "focus:ring-aura-success/30",
      ],
      !hasError &&
        !hasSuccess && [
          "border-aura-border",
          "focus:border-aura-accent",
          "focus:ring-aura-accent/30",
        ]
    );

    const containerStyles = clsx("relative", fullWidth && "w-full");

    const InputElement = inputType === "textarea" ? "textarea" : "input";

    return (
      <div className={containerStyles}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-aura-text-primary mb-1.5"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {prefixIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-aura-text-tertiary pointer-events-none">
              {prefixIcon}
            </div>
          )}

          <InputElement
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref={ref as any}
            id={inputId}
            type={inputType !== "textarea" ? inputType : undefined}
            rows={inputType === "textarea" ? rows : undefined}
            className={clsx(
              baseStyles,
              sizeStyles[size],
              stateStyles,
              prefixIcon && "pl-10",
              suffixIcon && "pr-10",
              inputType === "textarea" && "resize-y min-h-[6rem]",
              className
            )}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={clsx(hasError && errorId, helperText && helperId)}
            {...props}
          />

          {suffixIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-aura-text-tertiary pointer-events-none">
              {suffixIcon}
            </div>
          )}
        </div>

        {(error || success || helperText) && (
          <div className="mt-1.5 text-sm">
            {error && (
              <p id={errorId} className="text-aura-error">
                {error}
              </p>
            )}
            {success && !error && (
              <p className="text-aura-success">{success}</p>
            )}
            {helperText && !error && !success && (
              <p id={helperId} className="text-aura-text-secondary">
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

AuraInput.displayName = "AuraInput";
