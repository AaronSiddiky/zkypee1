"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/lib/database.types";
import { COST_PER_MINUTE } from "@/lib/stripe";

interface LowCreditWarningProps {
  threshold?: number; // Threshold in minutes
  className?: string;
}

export default function LowCreditWarning({
  threshold = 10, // Default: warn if less than 10 minutes of call time
  className = "",
}: LowCreditWarningProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchCreditBalance = async () => {
      try {
        setIsLoading(true);

        // Check if user is authenticated
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setIsLoading(false);
          return;
        }

        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        console.log("Fetching credit balance directly from Supabase");

        // Directly query the users table in Supabase
        const { data, error } = await supabase
          .from('users')
          .select('credit_balance')
          .eq('id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching credit balance from Supabase:", error);
          throw new Error(`Failed to fetch credit balance: ${error.message}`);
        }
        
        // If user exists, use their credit balance, otherwise create the user
        if (data) {
          const balance = data.credit_balance || 0;
          console.log("Credit balance fetched successfully:", balance);
          setCreditBalance(balance);

          // Calculate if warning should be shown
          const minutesAvailable = balance / COST_PER_MINUTE;
          setShowWarning(minutesAvailable < threshold);
        } else {
          console.log("User not found in database, creating user with default credits");
          
          // Default credits for new users
          const defaultCredits = 5.00;
          
          // Create user with default credits
          const { error: insertError } = await supabase
            .from('users')
            .insert([{ id: user.id, credit_balance: defaultCredits }]);
            
          if (insertError) {
            console.error("Error creating user:", insertError);
            // Still use the default credits even if insert fails
          }
          
          setCreditBalance(defaultCredits);
          
          // Calculate if warning should be shown with default credits
          const minutesAvailable = defaultCredits / COST_PER_MINUTE;
          setShowWarning(minutesAvailable < threshold);
        }
      } catch (error) {
        console.error("Error fetching credit balance:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreditBalance();

    // Set up a listener for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchCreditBalance();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, threshold]);

  // Don't show anything while loading or if no warning needed
  if (isLoading || !showWarning || creditBalance === null) {
    return null;
  }

  // Calculate minutes available
  const minutesAvailable = Math.floor(creditBalance / COST_PER_MINUTE);

  return (
    <div
      className={`p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-4 ${className}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 text-yellow-500 mt-0.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Low Credit Balance
          </h3>
          <div className="mt-1 text-sm text-yellow-700">
            <p>
              You have approximately {minutesAvailable} minutes of call time
              remaining.
            </p>
          </div>
          <div className="mt-2">
            <Link
              href="/credits"
              className="text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium px-3 py-1 rounded transition-colors"
            >
              Add Credits
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
