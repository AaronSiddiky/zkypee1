"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface CreditBalanceProps {
  showBuyButton?: boolean;
  className?: string;
}

export default function CreditBalance({
  showBuyButton = false,
  className = "",
}: CreditBalanceProps) {
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  useEffect(() => {
    const fetchCreditBalance = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Skip fetching if not authenticated
        if (!session) {
          setIsLoading(false);
          return;
        }

        // Fetch credit balance with auth token in header
        const response = await fetch("/api/credits/balance", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          credentials: "include", // Include credentials (cookies) with the request
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch credit balance");
        }

        setCreditBalance(data.creditBalance);
      } catch (err) {
        console.error("Error fetching credit balance:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreditBalance();
  }, [session]);

  if (isLoading) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <div className="animate-pulse bg-gray-200 h-5 w-20 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`inline-flex items-center text-red-500 ${className}`}>
        Error loading balance
      </div>
    );
  }

  // If not authenticated or no balance
  if (creditBalance === null) {
    return null;
  }

  const isLowBalance = creditBalance < 50; // Consider balance below 50 credits as low

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <Link href="/credits">
        <div
          className={`font-medium ${
            isLowBalance ? "text-red-500" : "text-green-600"
          } cursor-pointer hover:text-blue-600 transition-colors`}
        >
          Credits: {creditBalance.toFixed(0)}
        </div>
      </Link>

      {showBuyButton && (
        <Link
          href="/credits"
          className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
        >
          {isLowBalance ? "Low Balance! Buy Credits" : "Buy Credits"}
        </Link>
      )}
    </div>
  );
}
