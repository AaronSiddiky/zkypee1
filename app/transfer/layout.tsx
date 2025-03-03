"use client";

import React from "react";
import Link from "next/link";
import CustomCursor from "../../components/CustomCursor";

export default function TransferLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Custom Cursor */}
      <CustomCursor />

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
