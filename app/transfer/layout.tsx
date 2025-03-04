"use client";

import React, { useState } from "react";
import Link from "next/link";
import CustomCursor from "../../components/CustomCursor";
import HamburgerMenu from "../../components/HamburgerMenu";

export default function TransferLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Custom Cursor */}
      <CustomCursor />

      {/* Header with menu button */}
      <header className="p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-500">MonkeyTest</h1>
        <button 
          onClick={() => setMenuOpen(true)}
          className="text-gray-700"
        >
          Menu
        </button>
      </header>

      {/* Hamburger Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-white">
            <HamburgerMenu />
            <button 
              onClick={() => setMenuOpen(false)}
              className="absolute top-4 right-4 text-2xl"
            >
              &times;
            </button>
            <button 
              onClick={() => {/* existing code */}} 
              className="hamburger-button bg-[#82D091] text-white rounded-full py-2 px-4"
            >
              Call Now
            </button>
            <button 
              onClick={() => {/* existing code */}} 
              className="hamburger-button bg-[#4E84F7] text-white rounded-full py-2 px-4"
            >
              Join Waitlist
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="py-12 px-8">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-50 py-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-8 text-center text-sm text-gray-500">
          <p>Made by Fellow betrayed Skype Users at Columbia University</p>
        </div>
      </footer>
    </div>
  );
}
