"use client";

import React from "react";
import Link from "next/link";

interface ButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "small" | "medium" | "large";
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  fullWidth?: boolean;
  customWidth?: string;
  loading?: boolean;
}

export default function Button({
  href,
  onClick,
  children,
  variant = "primary",
  size = "medium",
  className = "",
  type = "button",
  disabled = false,
  fullWidth = false,
  customWidth = "",
  loading = false,
}: ButtonProps) {
  // Base styles
  const baseStyles = "rounded-full text-center font-medium";

  // Variant styles
  const variantStyles =
    variant === "primary"
      ? "bg-[#82D091] text-white hover:bg-[#6BC07F]"
      : "bg-[#4E84F7] text-white hover:bg-[#3D73E6]";

  // Responsive padding based on screen size
  const sizeStyles = {
    small: "px-3 py-1 text-xs",
    medium: "px-4 py-2 text-sm",
    large: "px-5 py-3 text-base",
  };

  // Width styles - more responsive
  const widthStyles = fullWidth
    ? "w-full"
    : customWidth
    ? customWidth
    : "w-auto max-w-[200px] mx-auto"; // Add max-width for mobile

  // Combine all styles
  const buttonStyles = `
    ${baseStyles} 
    ${variantStyles} 
    ${sizeStyles[size]} 
    ${widthStyles}
    ${disabled || loading ? "opacity-50 cursor-not-allowed" : ""}
    ${className}
    relative
  `;

  const content = loading ? (
    <>
      <span className="opacity-0">{children}</span>
      <span className="absolute inset-0 flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </span>
    </>
  ) : (
    children
  );

  // If href is provided, render as a Link (unless loading or disabled)
  if (href && !loading && !disabled) {
    return (
      <Link href={href} className={buttonStyles}>
        {content}
      </Link>
    );
  }

  // Otherwise, render as a button
  return (
    <button
      type={type}
      onClick={loading ? undefined : onClick}
      className={buttonStyles}
      disabled={disabled || loading}
    >
      {content}
    </button>
  );
}
