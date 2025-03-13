"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import dynamic from "next/dynamic";

// Dynamically import the dashboard to avoid SSR issues with recharts
const TrialAnalyticsDashboard = dynamic(
  () => import("@/components/TrialAnalyticsDashboard"),
  { ssr: false }
);

export default function AnalyticsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user || !user.app_metadata?.roles?.includes("admin")) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You don't have permission to view this page. This area is restricted
            to administrators only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Admin Dashboard
        </h1>

        <TrialAnalyticsDashboard />
      </div>
    </div>
  );
}
