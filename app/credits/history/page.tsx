"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/lib/database.types";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type CallLog = Database["public"]["Tables"]["call_logs"]["Row"];

type HistoryTab = "purchases" | "calls";

export default function CreditHistoryPage() {
  const [activeTab, setActiveTab] = useState<HistoryTab>("purchases");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<
    "all" | "7days" | "30days" | "90days"
  >("30days");
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check authentication status immediately when the component mounts
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);

      // If not authenticated, don't try to fetch data
      if (!session) {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if user is authenticated
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setError("You must be logged in to view your credit history");
          setIsLoading(false);
          return;
        }

        // Calculate date range
        const now = new Date();
        let startDate: Date | null = null;

        if (dateRange === "7days") {
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
        } else if (dateRange === "30days") {
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
        } else if (dateRange === "90days") {
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 90);
        }

        // Fetch transactions
        let transactionsQuery = supabase
          .from("transactions")
          .select("*")
          .order("created_at", { ascending: false });

        if (startDate) {
          transactionsQuery = transactionsQuery.gte(
            "created_at",
            startDate.toISOString()
          );
        }

        const { data: transactionsData, error: transactionsError } =
          await transactionsQuery;

        if (transactionsError) {
          throw new Error(transactionsError.message);
        }

        setTransactions(transactionsData || []);

        // Fetch call logs
        let callLogsQuery = supabase
          .from("call_logs")
          .select("*")
          .order("created_at", { ascending: false });

        if (startDate) {
          callLogsQuery = callLogsQuery.gte(
            "created_at",
            startDate.toISOString()
          );
        }

        const { data: callLogsData, error: callLogsError } =
          await callLogsQuery;

        if (callLogsError) {
          throw new Error(callLogsError.message);
        }

        setCallLogs(callLogsData || []);
      } catch (err) {
        console.error("Error fetching history data:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch data if authenticated
    if (isAuthenticated) {
      fetchData();
    }
  }, [supabase, dateRange, isAuthenticated]);

  // Calculate totals
  const calculateTotals = () => {
    const totalCreditsAdded = transactions.reduce(
      (sum, transaction) => sum + transaction.credits_added,
      0
    );
    const totalAmountSpent = transactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );
    const totalCallMinutes = callLogs.reduce(
      (sum, log) => sum + log.duration_minutes,
      0
    );
    const totalCreditsUsed = callLogs.reduce(
      (sum, log) => sum + log.credits_used,
      0
    );

    return {
      totalCreditsAdded: parseFloat(totalCreditsAdded.toFixed(2)),
      totalAmountSpent: parseFloat(totalAmountSpent.toFixed(2)),
      totalCallMinutes: parseFloat(totalCallMinutes.toFixed(2)),
      totalCreditsUsed: parseFloat(totalCreditsUsed.toFixed(2)),
    };
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 sm:p-6">
        <h1 className="text-3xl font-bold mb-6">Credit History</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Filter Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h2 className="text-lg font-semibold mb-2">Filter History</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setDateRange("7days")}
                  className={`px-3 py-1 rounded-md text-sm ${
                    dateRange === "7days"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setDateRange("30days")}
                  className={`px-3 py-1 rounded-md text-sm ${
                    dateRange === "30days"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => setDateRange("90days")}
                  className={`px-3 py-1 rounded-md text-sm ${
                    dateRange === "90days"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Last 90 Days
                </button>
                <button
                  onClick={() => setDateRange("all")}
                  className={`px-3 py-1 rounded-md text-sm ${
                    dateRange === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All Time
                </button>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab("purchases")}
                className={`px-4 py-2 rounded-md ${
                  activeTab === "purchases"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Purchases
              </button>
              <button
                onClick={() => setActiveTab("calls")}
                className={`px-4 py-2 rounded-md ${
                  activeTab === "calls"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Calls
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {activeTab === "purchases" ? (
            <>
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="text-sm text-gray-500">Total Purchases</div>
                <div className="text-2xl font-semibold">
                  {transactions.length}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="text-sm text-gray-500">Total Amount Spent</div>
                <div className="text-2xl font-semibold">
                  ${totals.totalAmountSpent.toFixed(2)}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="text-sm text-gray-500">Total Credits Added</div>
                <div className="text-2xl font-semibold">
                  {totals.totalCreditsAdded.toFixed(2)}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="text-sm text-gray-500">Average Purchase</div>
                <div className="text-2xl font-semibold">
                  $
                  {transactions.length > 0
                    ? (totals.totalAmountSpent / transactions.length).toFixed(2)
                    : "0.00"}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="text-sm text-gray-500">Total Calls</div>
                <div className="text-2xl font-semibold">{callLogs.length}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="text-sm text-gray-500">Total Minutes</div>
                <div className="text-2xl font-semibold">
                  {totals.totalCallMinutes.toFixed(2)}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="text-sm text-gray-500">Total Credits Used</div>
                <div className="text-2xl font-semibold">
                  {totals.totalCreditsUsed.toFixed(2)}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="text-sm text-gray-500">
                  Average Call Duration
                </div>
                <div className="text-2xl font-semibold">
                  {callLogs.length > 0
                    ? (totals.totalCallMinutes / callLogs.length).toFixed(2)
                    : "0.00"}{" "}
                  min
                </div>
              </div>
            </>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            {activeTab === "purchases" ? (
              <>
                <h2 className="text-xl font-semibold mb-4">Purchase History</h2>
                {transactions.length === 0 ? (
                  <p className="text-gray-500">
                    No purchase history found for the selected period.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Package
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Credits
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payment ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((transaction) => (
                          <tr key={transaction.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {format(
                                new Date(transaction.created_at),
                                "MMM d, yyyy h:mm a"
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {transaction.credits_added > 100
                                ? "Large Package"
                                : transaction.credits_added > 50
                                ? "Medium Package"
                                : "Small Package"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              ${transaction.amount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {transaction.credits_added.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {transaction.payment_intent_id.substring(0, 8)}...
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  transaction.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : transaction.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {transaction.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-4">Call History</h2>
                {callLogs.length === 0 ? (
                  <p className="text-gray-500">
                    No call history found for the selected period.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Call ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duration
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Credits Used
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {callLogs.map((log) => (
                          <tr key={log.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {format(
                                new Date(log.created_at),
                                "MMM d, yyyy h:mm a"
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {log.call_sid.substring(0, 8)}...
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {log.duration_minutes.toFixed(2)} min
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {log.credits_used.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  log.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : log.status === "in-progress"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
