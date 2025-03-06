import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  PhoneIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";

interface CallCreditInfoProps {
  phoneNumber: string;
  onCreditCheck?: (hasEnoughCredits: boolean) => void;
}

interface CreditInfo {
  hasEnoughCredits: boolean;
  currentBalance: number;
  ratePerMinute: number;
  estimatedMinutes: number;
  callHistory: {
    totalCalls: number;
    totalDuration: number;
    averageDuration: number;
  };
  country?: string;
  countryCode?: string;
  isLowBalance: boolean;
}

export default function CallCreditInfo({
  phoneNumber,
  onCreditCheck,
}: CallCreditInfoProps) {
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!phoneNumber) return;

    const fetchCreditInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate phone number format
        const cleanedNumber = phoneNumber.replace(/[\s\(\)\-]/g, "");
        if (cleanedNumber.length < 4) {
          setError("Please enter a valid phone number");
          setLoading(false);
          return;
        }

        // First, get the credit balance directly from Supabase
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("credit_balance")
          .eq("id", user?.id)
          .maybeSingle();

        if (userError) {
          console.error(
            "Error fetching credit balance from Supabase:",
            userError
          );
          throw new Error(
            `Failed to fetch credit balance: ${userError.message}`
          );
        }

        const creditBalance = userData?.credit_balance ?? 0;

        // Then get the rate information from the API
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session) {
          setError("Please log in to check credit information");
          setLoading(false);
          return;
        }

        const apiUrl =
          window.location.hostname === "localhost"
            ? `${window.location.protocol}//${window.location.hostname}:3000`
            : window.location.origin;

        const requestUrl = `${apiUrl}/api/credits/check?phoneNumber=${encodeURIComponent(
          cleanedNumber
        )}&duration=10`; // Request 10 minutes to match server requirement

        console.log(`Fetching credit info from: ${requestUrl}`);

        const response = await fetch(requestUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          credentials: "include",
        });

        console.log(
          `Response status: ${response.status} ${response.statusText}`
        );

        if (!response.ok) {
          let errorMessage = "Failed to check credit information";

          try {
            const errorData = await response.json();
            console.log(`Error response data:`, JSON.stringify(errorData));
            if (errorData.error) {
              errorMessage = errorData.error;
            }
            if (errorData.details) {
              errorMessage += `: ${errorData.details}`;
            }
          } catch (e) {
            errorMessage = `HTTP Error: ${response.status} ${response.statusText}`;
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log(`Credit info data:`, JSON.stringify(data));

        // Calculate values using the actual credit balance from Supabase
        const estimatedMinutes = creditBalance / data.ratePerMinute;
        const requiredCredits = data.ratePerMinute * 10; // 10 minutes as per API request

        // Use the credit balance from Supabase instead of the API response
        const updatedData = {
          ...data,
          currentBalance: creditBalance,
          hasEnoughCredits: creditBalance >= requiredCredits,
          estimatedMinutes: estimatedMinutes,
          requiredCredits: requiredCredits,
          isLowBalance: estimatedMinutes < 10, // Low balance if less than 10 minutes available
        };

        console.log("Updated credit info with Supabase balance:", {
          creditBalance,
          requiredCredits,
          estimatedMinutes,
          hasEnoughCredits: creditBalance >= requiredCredits,
        });

        setCreditInfo(updatedData);

        if (onCreditCheck) {
          onCreditCheck(updatedData.hasEnoughCredits);
        }
      } catch (err: any) {
        console.error("Error fetching credit info:", err);
        setError(err.message || "Failed to check credit information");
      } finally {
        setLoading(false);
      }
    };

    fetchCreditInfo();
  }, [phoneNumber, onCreditCheck, user]);

  if (loading) {
    return (
      <div className="animate-pulse p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="mt-4 h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="mt-3 h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-700">
        <div className="flex items-center">
          <ExclamationCircleIcon className="h-5 w-5 mr-2 text-red-500" />
          <span>Error: {error}</span>
        </div>
      </div>
    );
  }

  if (!creditInfo) {
    return null;
  }

  return (
    <div
      className={`p-4 border rounded-lg ${
        creditInfo.hasEnoughCredits
          ? "bg-green-50 border-green-200"
          : "bg-yellow-50 border-yellow-200"
      }`}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <CurrencyDollarIcon className="h-5 w-5 mr-2 text-gray-600" />
          <span className="font-medium">Your Credit Balance:</span>
        </div>
        <span className="text-lg font-semibold">
          ${creditInfo.currentBalance.toFixed(2)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="flex items-center">
          <PhoneIcon className="h-5 w-5 mr-2 text-gray-600" />
          <span className="text-sm">Rate per minute:</span>
        </div>
        <span className="text-sm font-medium">
          ${creditInfo.ratePerMinute.toFixed(4)}/min
        </span>

        <div className="flex items-center">
          <ClockIcon className="h-5 w-5 mr-2 text-gray-600" />
          <span className="text-sm">Estimated talk time:</span>
        </div>
        <span className="text-sm font-medium">
          {creditInfo.estimatedMinutes < 1
            ? `${Math.round(creditInfo.estimatedMinutes * 60)} seconds`
            : `${Math.floor(creditInfo.estimatedMinutes)} minutes`}
        </span>
      </div>

      {creditInfo.callHistory && (
        <div className="mt-4 pt-3 border-t border-gray-200"></div>
      )}

      {!creditInfo.hasEnoughCredits && (
        <div className="mt-4 p-3 bg-yellow-100 rounded-md text-sm">
          <div className="flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 mr-2 text-yellow-600" />
            <span className="font-medium text-yellow-800">
              Your balance is low. Consider adding credits before making this
              call.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
