"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/lib/database.types";
import { CREDIT_PACKAGES, COST_PER_MINUTE } from "@/lib/stripe";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type CallLog = Database["public"]["Tables"]["call_logs"]["Row"];

export default function CreditDashboardPage() {
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

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

        // Get the user session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setError("You must be logged in to view your credit dashboard");
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

        // Fetch recent transactions (limit to 5)
        const { data: transactionsData, error: transactionsError } =
          await supabase
            .from("transactions")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5);

        if (transactionsError) {
          throw new Error(transactionsError.message);
        }

        setTransactions(transactionsData || []);

        // Fetch recent call logs (limit to 5)
        const { data: callLogsData, error: callLogsError } = await supabase
          .from("call_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        if (callLogsError) {
          throw new Error(callLogsError.message);
        }

        setCallLogs(callLogsData || []);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
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
  }, [supabase, isAuthenticated]);

  const handlePurchase = async (packageId: string) => {
    try {
      setIsProcessing(true);
      setSelectedPackage(packageId);

      // Get the user session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError("You must be logged in to purchase credits");
        return;
      }

      // Create checkout session with auth token in header
      const response = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        credentials: "include", // Include credentials (cookies) with the request
        body: JSON.stringify({ packageId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Error creating checkout session:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsProcessing(false);
      setSelectedPackage(null);
    }
  };

  // Calculate usage statistics
  const calculateUsageStats = () => {
    if (!callLogs || callLogs.length === 0) {
      return {
        totalMinutes: 0,
        totalCost: 0,
        averageCallDuration: 0,
      };
    }

    const totalMinutes = callLogs.reduce(
      (sum, log) => sum + log.duration_minutes,
      0
    );
    const totalCost = callLogs.reduce((sum, log) => sum + log.credits_used, 0);
    const averageCallDuration = totalMinutes / callLogs.length;

    return {
      totalMinutes: parseFloat(totalMinutes.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      averageCallDuration: parseFloat(averageCallDuration.toFixed(2)),
    };
  };

  const usageStats = calculateUsageStats();
  const minutesRemaining =
    creditBalance !== null
      ? parseFloat((creditBalance / COST_PER_MINUTE).toFixed(2))
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <h1 className="text-3xl font-bold mb-6">Credit Dashboard</h1>

          {/* Authentication Check */}
          {isAuthenticated === false && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded mb-6">
              <div className="flex flex-col items-center">
                <p className="text-lg font-medium mb-4">
                  You must be logged in to view your credit dashboard
                </p>
                <button
                  onClick={() =>
                    router.push("/auth/signin?redirect=/credits/dashboard")
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition-colors"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {isLoading && isAuthenticated !== false ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            isAuthenticated && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Credit Balance Card */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold mb-4">Credit Balance</h2>
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {creditBalance !== null ? creditBalance.toFixed(2) : "—"}
                  </div>
                  <div className="text-gray-600 mb-4">
                    Approximately {minutesRemaining} minutes of call time
                  </div>
                  <Link
                    href="/credits"
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-medium py-2 px-4 rounded transition-colors"
                  >
                    Add Credits
                  </Link>
                </div>

                {/* Usage Statistics Card */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold mb-4">
                    Usage Statistics
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-500">
                        Total Call Minutes
                      </div>
                      <div className="text-2xl font-semibold">
                        {usageStats.totalMinutes}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">
                        Total Credits Used
                      </div>
                      <div className="text-2xl font-semibold">
                        {usageStats.totalCost}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">
                        Average Call Duration
                      </div>
                      <div className="text-2xl font-semibold">
                        {usageStats.averageCallDuration} min
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/credits/history"
                    className="block w-full text-center text-blue-600 hover:text-blue-800 font-medium mt-4"
                  >
                    View Full History
                  </Link>
                </div>

                {/* Quick Purchase Card */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold mb-4">Quick Purchase</h2>
                  <div className="space-y-3">
                    {CREDIT_PACKAGES.slice(0, 3).map((pkg) => (
                      <button
                        key={pkg.id}
                        onClick={() => handlePurchase(pkg.id)}
                        disabled={isProcessing && selectedPackage === pkg.id}
                        className="w-full flex justify-between items-center bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md p-3 transition-colors"
                      >
                        <span className="font-medium">{pkg.name}</span>
                        <span className="text-blue-600 font-bold">
                          ${pkg.amount}
                        </span>
                      </button>
                    ))}
                  </div>
                  <Link
                    href="/credits"
                    className="block w-full text-center text-blue-600 hover:text-blue-800 font-medium mt-4"
                  >
                    See All Packages
                  </Link>
                </div>

                {/* Recent Transactions */}
                <div className="lg:col-span-3 bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold mb-4">
                    Recent Activity
                  </h2>

                  <div className="mb-6">
                    <h3 className="font-medium text-gray-700 mb-3">
                      Recent Purchases
                    </h3>
                    {transactions.length === 0 ? (
                      <p className="text-gray-500">No recent purchases</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Credits
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
                                    "MMM d, yyyy"
                                  )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  ${transaction.amount.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {transaction.credits_added.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    {transaction.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-700 mb-3">
                      Recent Calls
                    </h3>
                    {callLogs.length === 0 ? (
                      <p className="text-gray-500">No recent calls</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
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
                                    "MMM d, yyyy"
                                  )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {log.duration_minutes.toFixed(2)} min
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {log.credits_used.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                    {log.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
