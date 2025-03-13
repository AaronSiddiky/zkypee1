"use client";

import React, { useEffect, useState } from "react";
import { useTwilio } from "@/contexts/TwilioContext";

interface TrialDebugState {
  ipAddress: string | null;
  rawIpAddress: string | null;
  fingerprint: string | null;
  trialUsage: {
    callsUsed: number;
    callsRemaining: number;
    totalDuration: number;
    lastCallAt: string | null;
  } | null;
  lastUpdated: Date;
  error: string | null;
  dbRecords: any[] | null;
}

// Helper function to normalize IP address
function normalizeIpAddress(ip: string): string {
  if (!ip) return ip;
  if (ip === "::1") return "127.0.0.1";
  if (ip === "localhost" || ip === "::ffff:127.0.0.1") return "127.0.0.1";
  if (ip.startsWith("::ffff:")) return ip.substring(7);
  return ip;
}

export default function TrialDebugInfo() {
  const { isTrialMode, setTrialCallsRemaining } = useTwilio();
  const [debugState, setDebugState] = useState<TrialDebugState>({
    ipAddress: null,
    rawIpAddress: null,
    fingerprint: null,
    trialUsage: null,
    lastUpdated: new Date(),
    error: null,
    dbRecords: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        // Get stored identifiers
        const fingerprint = localStorage.getItem("zkypee_trial_fingerprint");
        const rawIpAddress = localStorage.getItem("zkypee_trial_ip_address");
        const ipAddress = rawIpAddress
          ? normalizeIpAddress(rawIpAddress)
          : null;

        if (!fingerprint || !ipAddress) {
          setDebugState((prev) => ({
            ...prev,
            error: "Missing fingerprint or IP address",
            lastUpdated: new Date(),
            rawIpAddress,
            ipAddress,
            fingerprint,
          }));
          return;
        }

        // Directly fetch from API for most up-to-date values
        try {
          console.log(
            "[TRIAL DEBUG] Fetching usage directly from API endpoint"
          );
          const response = await fetch(
            `/api/trial/get-usage?fingerprint=${encodeURIComponent(
              fingerprint
            )}&ipAddress=${encodeURIComponent(ipAddress)}`
          );

          if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
          }

          const usage = await response.json();
          console.log("[TRIAL DEBUG] API response:", usage);

          // Update the UI state with API data
          setDebugState((prev) => ({
            ...prev,
            ipAddress,
            rawIpAddress,
            fingerprint,
            trialUsage: usage,
            lastUpdated: new Date(),
            error: null,
          }));

          // Also update the global trial state to ensure consistency
          setTrialCallsRemaining(usage.callsRemaining);
        } catch (usageError) {
          console.error("[TRIAL DEBUG] Error getting trial usage:", usageError);
          setDebugState((prev) => ({
            ...prev,
            error:
              usageError instanceof Error
                ? usageError.message
                : "Unknown error getting trial usage",
            lastUpdated: new Date(),
            rawIpAddress,
            ipAddress,
            fingerprint,
          }));
        }
      } catch (error) {
        console.error("[TRIAL DEBUG] Error in fetchDebugInfo:", error);
        setDebugState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Unknown error in fetchDebugInfo",
          lastUpdated: new Date(),
        }));
      }
    };

    // Fetch immediately
    fetchDebugInfo();

    // Set up interval to refresh every 2 seconds for more responsive updates
    const interval = setInterval(fetchDebugInfo, 2000);

    return () => clearInterval(interval);
  }, [setTrialCallsRemaining]);

  const queryDatabase = async () => {
    try {
      setIsLoading(true);
      const { debugQueryTrialCalls } = await import("@/lib/trial-limitations");
      const result = await debugQueryTrialCalls();

      if (result.error) {
        setDebugState((prev) => ({
          ...prev,
          error: `Database query error: ${
            result.error.message || "Unknown error"
          }`,
          lastUpdated: new Date(),
        }));
      } else {
        setDebugState((prev) => ({
          ...prev,
          dbRecords: result.data,
          lastUpdated: new Date(),
          error: null,
        }));
      }
    } catch (error) {
      console.error("[TRIAL DEBUG] Error querying database:", error);
      setDebugState((prev) => ({
        ...prev,
        error: `Error querying database: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        lastUpdated: new Date(),
      }));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isTrialMode) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg opacity-80 hover:opacity-100 transition-opacity z-50 text-sm font-mono max-w-md overflow-auto max-h-[80vh]">
      <h3 className="font-bold mb-2">Trial Debug Info</h3>
      <div className="space-y-1">
        <p>Normalized IP: {debugState.ipAddress || "Not found"}</p>
        <p>Raw IP: {debugState.rawIpAddress || "Not found"}</p>
        <p>
          Fingerprint: {debugState.fingerprint?.substring(0, 8) || "Not found"}
          ...
        </p>
        {debugState.trialUsage && (
          <>
            <p>Calls Used: {debugState.trialUsage.callsUsed}</p>
            <p>Calls Remaining: {debugState.trialUsage.callsRemaining}</p>
            <p>Total Duration: {debugState.trialUsage.totalDuration}s</p>
            <p>
              Last Call:{" "}
              {debugState.trialUsage.lastCallAt
                ? new Date(debugState.trialUsage.lastCallAt).toLocaleString()
                : "Never"}
            </p>
          </>
        )}

        <button
          onClick={queryDatabase}
          disabled={isLoading}
          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-xs"
        >
          {isLoading ? "Loading..." : "Query Database"}
        </button>

        {debugState.dbRecords && (
          <div className="mt-2">
            <h4 className="font-bold">Database Records:</h4>
            <div className="max-h-40 overflow-y-auto mt-1">
              {debugState.dbRecords.length === 0 ? (
                <p className="text-yellow-400">No records found</p>
              ) : (
                debugState.dbRecords.map((record, index) => (
                  <div
                    key={index}
                    className="border-t border-gray-700 py-1 mt-1"
                  >
                    <p>IP: {record.ip_address}</p>
                    <p>Fingerprint: {record.device_fingerprint}</p>
                    <p>Count: {record.count}</p>
                    <p>
                      Last Call:{" "}
                      {new Date(record.last_call_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {debugState.error && (
          <p className="text-red-400 mt-2">Error: {debugState.error}</p>
        )}
        <p className="text-xs text-gray-400 mt-2">
          Last Updated: {debugState.lastUpdated.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
