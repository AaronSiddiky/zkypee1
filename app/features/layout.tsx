"use client";

import React from "react";
import Link from "next/link";
import CustomCursor from "../../components/CustomCursor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zkypee Features | Best Skype Alternative & Free Replacement",
  description:
    "Compare Zkypee features with Skype. As the best Skype alternative now that Skype is shutting down, Zkypee offers a free Skype replacement with enhanced calling, messaging, and collaboration features.",
  keywords:
    "Skype features, Best Skype alternative, Skype shutting down alternative, Free Skype replacement, video calls, voice calls",
};

export default function FeaturesLayout({
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
