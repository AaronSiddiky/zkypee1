"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";

export default function ThankYouPage() {
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const { session, user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if credits were added successfully
    const creditsAdded = searchParams.get("creditsAdded");
    if (creditsAdded === "false") {
      setShowWarning(true);
    }

    // Only fetch data if the user is authenticated
    if (!authLoading && session && user) {
      fetchCreditBalance();
    } else if (!authLoading && !session) {
      // If auth is done loading and we don't have a session, we're not authenticated
      setIsLoading(false);
    }
  }, [session, user, authLoading, searchParams]);

  const fetchCreditBalance = async () => {
    try {
      setIsLoading(true);

      if (!user) {
        console.log("No user available, skipping fetch");
        setIsLoading(false);
        return;
      }

      console.log("Fetching credit balance directly from Supabase");

      // Directly query the users table in Supabase
      const { data, error } = await supabase
        .from("users")
        .select("credit_balance")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching credit balance from Supabase:", error);
        throw new Error(`Failed to fetch credit balance: ${error.message}`);
      }

      // If user exists, use their credit balance, otherwise default to 0
      if (data) {
        console.log(
          "Credit balance fetched successfully:",
          data.credit_balance
        );
        setCreditBalance(data.credit_balance || 0);
      } else {
        console.log("User not found in database, setting credit balance to 0");
        setCreditBalance(0);
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

      {showWarning && (
        <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded-md">
          <p className="font-medium">
            Note: There might have been an issue adding credits to your account.
          </p>
          <p>
            Don't worry, your payment was successful and our team has been
            notified. Your credits will be added shortly.
          </p>
        </div>
      )}

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
