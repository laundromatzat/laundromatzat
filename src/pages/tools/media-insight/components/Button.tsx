/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  isLoading,
  icon,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-aura-bg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]";

  const variants = {
    primary: "mi-btn-gradient shadow-lg hover:shadow-xl",
    secondary:
      "mi-card-glass text-aura-text-primary border-2 border-purple-200 hover:border-purple-400 focus:ring-purple-400 shadow-md hover:shadow-lg",
    danger:
      "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 focus:ring-red-500 shadow-lg hover:shadow-xl",
    ghost:
      "bg-transparent text-aura-text-secondary hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-5 w-5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : icon ? (
        <span>{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

export default Button;
