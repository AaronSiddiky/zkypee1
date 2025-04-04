"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function CreditBalance() {
  const { user } = useAuth();
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  // Fetch credit balance from Supabase when user is available
  useEffect(() => {
    const fetchCreditBalance = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching credit balance for user:", user.id);
        const { data, error } = await supabase
          .from('users')
          .select('credit_balance')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error("Error fetching credit balance:", error);
          return;
        }

        if (data) {
          console.log("Credit balance fetched:", data.credit_balance);
          setCreditBalance(data.credit_balance || 0);
        } else {
          // If no data, use default value
          setCreditBalance(0);
        }
      } catch (err) {
        console.error("Failed to fetch credit balance:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCreditBalance();
  }, [user, supabase]);

  return (
    <div className="h-[24px] flex items-center">
      {loading ? (
        <div className="w-16 h-6 bg-white/20 animate-pulse rounded"></div>
      ) : (
        <p className="text-white text-lg font-medium">
          ${creditBalance !== null ? creditBalance.toFixed(2) : '0.00'}
        </p>
      )}
    </div>
  );
}
