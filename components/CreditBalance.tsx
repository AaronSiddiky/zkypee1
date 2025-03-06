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
  const { session, user } = useAuth();

  useEffect(() => {
    const fetchCreditBalance = async () => {
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
          console.log("Credit balance fetched successfully:", data.credit_balance);
          setCreditBalance(data.credit_balance || 0);
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
            // Still show the default credits even if insert fails
          }
          
          setCreditBalance(defaultCredits);
        }
      } catch (err) {
        console.error("Error in fetchCreditBalance:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreditBalance();
  }, [session, user]);

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
