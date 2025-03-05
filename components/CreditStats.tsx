"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/lib/database.types";
import { COST_PER_MINUTE } from "@/lib/stripe";
import Link from "next/link";

interface CreditStatsProps {
  className?: string;
  showDetailedStats?: boolean;
}

export default function CreditStats({
  className = "",
  showDetailedStats = false,
}: CreditStatsProps) {
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [callStats, setCallStats] = useState<{
    totalCalls: number;
    totalMinutes: number;
    totalCreditsUsed: number;
  }>({
    totalCalls: 0,
    totalMinutes: 0,
    totalCreditsUsed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get the user session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setError("You must be logged in to view credit statistics");
          setIsLoading(false);
          return;
        }

        // Fetch credit balance with auth token in header
        const balanceResponse = await fetch("/api/credits/balance", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          credentials: "include", // Include credentials (cookies) with the request
        });
        const balanceData = await balanceResponse.json();

        if (!balanceResponse.ok) {
          throw new Error(
            balanceData.error || "Failed to fetch credit balance"
          );
        }

        setCreditBalance(balanceData.creditBalance);

        // Fetch call statistics
        const { data: callLogsData, error: callLogsError } = await supabase
          .from("call_logs")
          .select("duration_minutes, credits_used");

        if (callLogsError) {
          throw new Error(callLogsError.message);
        }

        if (callLogsData) {
          const totalCalls = callLogsData.length;
          const totalMinutes = callLogsData.reduce(
            (sum, log) => sum + log.duration_minutes,
            0
          );
          const totalCreditsUsed = callLogsData.reduce(
            (sum, log) => sum + log.credits_used,
            0
          );

          setCallStats({
            totalCalls,
            totalMinutes: parseFloat(totalMinutes.toFixed(2)),
            totalCreditsUsed: parseFloat(totalCreditsUsed.toFixed(2)),
          });
        }
      } catch (err) {
        console.error("Error fetching credit stats:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const minutesRemaining =
    creditBalance !== null
      ? parseFloat((creditBalance / COST_PER_MINUTE).toFixed(2))
      : 0;
  const averageCallDuration =
    callStats.totalCalls > 0
      ? parseFloat((callStats.totalMinutes / callStats.totalCalls).toFixed(2))
      : 0;

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center py-4 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className={`text-sm text-red-600 ${className}`}>{error}</div>;
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-sm p-4 border border-gray-200 ${className}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Credit Statistics</h3>
        <Link
          href="/credits/dashboard"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-sm text-gray-500">Current Balance</div>
          <div className="text-xl font-semibold text-blue-600">
            {creditBalance !== null ? creditBalance.toFixed(2) : "—"}
          </div>
          <div className="text-xs text-gray-500">
            {minutesRemaining} minutes remaining
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Total Used</div>
          <div className="text-xl font-semibold">
            {callStats.totalCreditsUsed.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">
            across {callStats.totalCalls} calls
          </div>
        </div>
      </div>

      {showDetailedStats && (
        <div className="border-t border-gray-100 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Total Call Minutes</div>
              <div className="text-lg font-medium">
                {callStats.totalMinutes.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Avg. Call Duration</div>
              <div className="text-lg font-medium">
                {averageCallDuration} min
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        <Link
          href="/credits"
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-medium py-2 px-4 rounded text-sm transition-colors"
        >
          Add Credits
        </Link>
      </div>
    </div>
  );
}
