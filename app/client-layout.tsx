"use client";

import React from "react";
import { AuthProvider } from "../contexts/AuthContext";
import { TwilioProvider } from "../contexts/TwilioContext";
import InactivityWarningModal from "../components/InactivityWarningModal";
import { Analytics } from "@vercel/analytics/react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <TwilioProvider>
        <div className="min-h-screen bg-[#00AFF0] text-white m-0 p-0 overflow-hidden flex flex-col">
          <Header />
          <InactivityWarningModal />
          <Analytics />
          <div className="flex-grow m-0 p-0">
            {children}
          </div>
          <Footer />
        </div>
      </TwilioProvider>
    </AuthProvider>
  );
}
