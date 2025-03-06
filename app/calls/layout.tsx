"use client";

import React from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import CallsNavigation from "@/app/components/CallsNavigation";

export default function CallsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <CallsNavigation />
        {children}
      </div>
    </AuthProvider>
  );
}
