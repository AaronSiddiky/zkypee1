"use client";

import React from 'react';
import Link from 'next/link';

interface ButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export default function Button({
  href,
  onClick,
  children,
  variant = 'primary',
  size = 'medium',
  className = '',
  type = 'button',
  disabled = false,
}: ButtonProps) {
  // Determine base styles based on variant
  const baseStyles = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    outline: 'bg-transparent text-blue-500 border border-blue-500 hover:bg-blue-50',
  };
  
  // Determine size styles
  const sizeStyles = {
    small: 'px-3 py-1 text-sm',
    medium: 'px-6 py-2',
    large: 'px-8 py-3 text-lg',
  };
  
  // Combine all styles
  const buttonStyles = `
    ${baseStyles[variant]} 
    ${sizeStyles[size]} 
    rounded-full 
    transition-colors 
    focus:outline-none 
    focus:ring-2 
    focus:ring-blue-500 
    focus:ring-opacity-50
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
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