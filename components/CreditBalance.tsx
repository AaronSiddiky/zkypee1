"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

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
  const [hasRefreshedSession, setHasRefreshedSession] = useState(false);
  const { session, user } = useAuth();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchCreditBalance = async () => {
      // Clear any existing timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Skip fetching if not authenticated
        if (!session || !user) {
          console.log("No session or user available, skipping fetch");
          setIsLoading(false);
          setError("Please sign in to view credits");
          return;
        }

        console.log("Attempting to fetch credit balance with auth token...");

        // Only try to refresh the session once and not if we've recently hit a rate limit
        if (!hasRefreshedSession) {
          setHasRefreshedSession(true);
          try {
            const { data, error } = await supabase.auth.refreshSession();
            if (error) {
              console.log("Failed to refresh session:", error.message);

              // If we hit a rate limit, don't try again immediately
              if (error.message?.includes("rate limit")) {
                console.log("Rate limit hit, will retry after delay");
                // Set a timeout to try again in 10 seconds
                refreshTimeoutRef.current = setTimeout(() => {
                  setHasRefreshedSession(false); // Allow one more refresh attempt after delay
                }, 10000);
                throw new Error("Rate limit exceeded. Please wait a moment.");
              }
            } else if (data.session) {
              console.log("Session refreshed successfully");
            }
          } catch (refreshError) {
            console.error("Error refreshing session:", refreshError);
            if (
              refreshError instanceof Error &&
              refreshError.message.includes("rate limit")
            ) {
              setIsLoading(false);
              setError(
                "Rate limit exceeded. Please wait a moment and try again."
              );
              return;
            }
          }
        }

        // Fetch credit balance with auth token in header
        const response = await fetch("/api/credits/balance", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          credentials: "include", // Include credentials (cookies) with the request
          cache: "no-store", // Add cache busting to prevent stale responses
        });

        const data = await response.json();

        if (!response.ok) {
          // Handle rate limit response
          if (response.status === 429) {
            throw new Error(
              "Rate limit exceeded. Please wait a moment and try again."
            );
          }
          throw new Error(data.error || "Failed to fetch credit balance");
        }

        setCreditBalance(data.creditBalance);
      } catch (err) {
        console.error("Error fetching credit balance:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );

        // If this was a rate limit error, set a timeout to retry
        if (err instanceof Error && err.message.includes("rate limit")) {
          refreshTimeoutRef.current = setTimeout(() => {
            setHasRefreshedSession(false); // Allow one more refresh attempt after delay
          }, 10000);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreditBalance();
  }, [session, user, hasRefreshedSession]);

  const renderCreditBalance = () => {
    if (isLoading) {
      return <span className={`text-gray-500 ${className}`}>Loading...</span>;
    }

    if (error) {
      return <span className={`text-red-500 ${className}`}>{error}</span>;
    }

    return (
      <div className="flex items-center">
        <span className={`${className}`}>
          ${creditBalance?.toFixed(2) || "0.00"}
        </span>
        {showBuyButton && (
          <Link
            href="/credits"
            className="ml-2 text-blue-500 hover:underline text-sm hidden md:inline-block"
          >
            Buy More
          </Link>
        )}
      </div>
    );
  };

  return renderCreditBalance();
}
