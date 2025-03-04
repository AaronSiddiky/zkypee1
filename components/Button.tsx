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
}: ButtonProps) {
  // Base styles
  const baseStyles = "rounded-full text-center font-medium";
  
  // Variant styles
  const variantStyles = variant === "primary" 
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
    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
    ${className}
  `;

  // If href is provided, render as a Link
  if (href) {
    return (
      <Link href={href} className={buttonStyles}>
        {children}
      </Link>
    );
  }

  // Otherwise, render as a button
  return (
    <button
      type={type}
      onClick={onClick}
      className={buttonStyles}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
