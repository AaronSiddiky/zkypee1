"use client";

import React from 'react';
import Link from 'next/link';
import CustomCursor from '../../components/CustomCursor';

export default function TransferLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Custom Cursor */}
      <CustomCursor />
      
      {/* Navbar */}
      <header className="relative z-10 px-8 py-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/">
            <span className="text-blue-500 text-3xl font-bold">Z</span>
          </Link>
          
          <nav className="flex space-x-8">
            <Link href="/rates" className="text-gray-700 hover:text-blue-500">
              Rates
            </Link>
            <Link href="/features" className="text-gray-700 hover:text-blue-500">
              Features
            </Link>
            <Link href="/transfer" className="text-gray-700 hover:text-blue-500 font-medium">
              Transfer Skype Credits
            </Link>
          </nav>
          
          <div>
            <Link href="/signup" className="bg-blue-500 text-white px-6 py-2 rounded-full flex items-center">
              Sign Up
            </Link>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="py-12 px-8">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-50 py-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-8 text-center text-sm text-gray-500">
          <p>Made by Fellow betrayed Skype Users at Columbia University</p>
        </div>
      </footer>
    </div>
  );
} 