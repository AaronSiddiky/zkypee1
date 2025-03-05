"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function ThankYouPage() {
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { session, loading: authLoading } = useAuth();

  useEffect(() => {
    // Only fetch data if the user is authenticated
    if (!authLoading && session) {
      fetchCreditBalance();
    } else if (!authLoading && !session) {
      // If auth is done loading and we don't have a session, we're not authenticated
      setIsLoading(false);
    }
  }, [session, authLoading]);

  const fetchCreditBalance = async () => {
    try {
      setIsLoading(true);

      // Fetch credit balance with auth token in header
      const response = await fetch("/api/credits/balance", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        credentials: "include",
      });
      const data = await response.json();

      if (response.ok) {
        setCreditBalance(data.creditBalance);
      }
    } catch (error) {
      console.error("Error fetching credit balance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="mb-8 text-green-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-24 w-24 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h1 className="text-3xl font-bold mb-4">Thank You for Your Purchase!</h1>
      <p className="mb-4">
        Your payment has been processed successfully and your credits have been
        added to your account.
      </p>

      {isLoading ? (
        <div className="mb-8">
          <div className="inline-block animate-pulse bg-gray-200 h-6 w-32 rounded"></div>
        </div>
      ) : (
        <p className="mb-8 text-xl">
          Your current credit balance:{" "}
          <span className="font-bold">
            {creditBalance !== null ? creditBalance.toFixed(2) : "—"}
          </span>{" "}
          credits
        </p>
      )}

      <div className="flex justify-center space-x-4">
        <Link
          href="/credits"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition-colors"
        >
          Buy More Credits
        </Link>
        <Link
          href="/dial"
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded transition-colors"
        >
          Make a Call
        </Link>
      </div>
    </div>
  );
}
