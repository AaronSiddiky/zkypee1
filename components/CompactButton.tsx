"use client";

import React from "react";

interface CompactButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}

export default function CompactButton({
  onClick,
  children,
  variant = "primary",
  className = "",
}: CompactButtonProps) {
  // Super simple button with minimal styling
  const buttonStyle = variant === "primary"
    ? "bg-[#82D091] text-white" 
    : "bg-[#4E84F7] text-white";
  
  return (
    <button
      onClick={onClick}
      className={`rounded-full py-2 px-5 text-sm ${buttonStyle} ${className}`}
    >
      {children}
    </button>
  );
} 