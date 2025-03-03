"use client";

import React from "react";
import PhoneDialer from "../../components/PhoneDialer";
import { AuthProvider, useAuth } from "../../contexts/AuthContext";

function DialerPageContent() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Zkypee Phone Dialer
      </h1>
      <p className="text-gray-600 mb-8 text-center max-w-md">
        Make calls to any phone number worldwide using WebRTC technology.
      </p>
      <PhoneDialer user={user} loading={loading} />
    </div>
  );
}

export default function DialerPage() {
  return (
    <AuthProvider>
      <DialerPageContent />
    </AuthProvider>
  );
}
