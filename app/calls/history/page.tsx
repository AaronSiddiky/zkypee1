"use client";

import React, { useState, useEffect } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Link from "next/link";
import {
  PhoneIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

interface CallLog {
  id: string;
  user_id: string;
  phone_number: string;
  duration_seconds: number;
  cost: number;
  created_at: string;
  status: string;
}

export default function CallHistoryPage() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCalls, setTotalCalls] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const supabase = useSupabaseClient();
  const pageSize = 10;

  useEffect(() => {
    fetchCallHistory();
  }, [page]);

  const fetchCallHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the user's session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("You must be logged in to view call history");
        return;
      }

      // Fetch call history from the API
      const response = await fetch(
        `/api/calls/history?page=${page}&limit=${pageSize}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch call history");
      }

      const data = await response.json();
      setCallLogs(data.calls);
      setHasMore(data.hasMore);
      setTotalCalls(data.totalCalls);
      setTotalCost(data.totalCost || 0);
    } catch (err: any) {
      console.error("Error fetching call history:", err);
      setError(err.message || "Failed to fetch call history");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    // Simple phone number formatter - could be enhanced for different formats
    if (!phoneNumber) return "";

    // For US numbers: (123) 456-7890
    if (phoneNumber.startsWith("+1") && phoneNumber.length === 12) {
      return `(${phoneNumber.substring(2, 5)}) ${phoneNumber.substring(
        5,
        8
      )}-${phoneNumber.substring(8)}`;
    }

    // Generic international format
    return phoneNumber;
  };

  if (loading && callLogs.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Call History</h1>
          <div className="animate-pulse">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow mb-4">
                <div className="flex justify-between">
                  <div className="h-6 bg-gray-200 rounded w-40"></div>
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="mt-4 h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Call History</h1>
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-700">
            <p>Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (callLogs.length === 0 && !loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Call History</h1>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <PhoneIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-medium text-gray-700 mb-2">
              No Call History
            </h2>
            <p className="text-gray-500 mb-4">
              You haven't made any calls yet.
            </p>
            <Link
              href="/dial"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
            >
              Make Your First Call
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Call History</h1>

        <div className="bg-white p-4 rounded-lg shadow mb-6 flex justify-between items-center">
          <div>
            <p className="text-gray-600">Total Calls</p>
            <p className="text-xl font-semibold">{totalCalls}</p>
          </div>
          <div>
            <p className="text-gray-600 flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 mr-1 text-gray-500" />
              Total Spent
            </p>
            <p className="text-xl font-semibold">${totalCost.toFixed(2)}</p>
          </div>
        </div>

        <div className="space-y-4">
          {callLogs.map((call) => (
            <div key={call.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between">
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 mr-2 text-gray-500" />
                  <span className="font-medium">
                    {formatPhoneNumber(call.phone_number)}
                  </span>
                </div>
                <div className="text-gray-600 text-sm">
                  {formatDate(call.created_at)}
                </div>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Duration</p>
                  <p className="font-medium">
                    {formatDuration(call.duration_seconds)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Cost</p>
                  <p className="font-medium">${call.cost.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <p
                    className={`font-medium ${
                      call.status === "completed"
                        ? "text-green-600"
                        : call.status === "failed"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`flex items-center px-3 py-1 rounded ${
              page === 1
                ? "text-gray-400 cursor-not-allowed"
                : "text-blue-600 hover:bg-blue-50"
            }`}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Previous
          </button>

          <span className="text-gray-600">
            Page {page}{" "}
            {totalCalls ? `of ${Math.ceil(totalCalls / pageSize)}` : ""}
          </span>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
            className={`flex items-center px-3 py-1 rounded ${
              !hasMore
                ? "text-gray-400 cursor-not-allowed"
                : "text-blue-600 hover:bg-blue-50"
            }`}
          >
            Next
            <ArrowRightIcon className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
