"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserPhoneNumbers,
  getUserPhoneNumbersWithSubscriptions,
} from "@/lib/phoneNumbers";
import { setTwilioPhoneNumber } from "@/app/api/twilio/phone-number";
import { useRouter } from "next/navigation";

export default function MyNumbersPage() {
  const { user, loading: authLoading } = useAuth();
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);
  const [phoneNumberSubscriptions, setPhoneNumberSubscriptions] = useState<
    Map<string, string>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [cancellingNumber, setCancellingNumber] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchPhoneNumbers() {
      if (!user) return;

      setLoading(true);
      try {
        // Get phone numbers with their subscription IDs
        const numbersWithSubs = await getUserPhoneNumbersWithSubscriptions(
          user.id
        );
        setPhoneNumberSubscriptions(numbersWithSubs);
        setPhoneNumbers(Array.from(numbersWithSubs.keys()));

        // If no numbers found with subscriptions, fall back to the regular method
        if (numbersWithSubs.size === 0) {
          const numbers = await getUserPhoneNumbers(user.id);
          setPhoneNumbers(numbers);
        }
      } catch (error) {
        console.error("Error fetching phone numbers:", error);

        // Fallback to just getting phone numbers without subscription info
        try {
          const numbers = await getUserPhoneNumbers(user.id);
          setPhoneNumbers(numbers);
        } catch (fallbackError) {
          console.error("Error in fallback phone number fetch:", fallbackError);
        }
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchPhoneNumbers();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const handleCallUsingNumber = (number: string) => {
    setTwilioPhoneNumber(number);
    router.push("/dial");
  };

  const handleCancelThisNumber = async (number: string) => {
    if (!user) return;

    try {
      setCancellingNumber(number);

      // Get the subscription ID for this phone number
      const subscriptionId = phoneNumberSubscriptions.get(number);

      if (!subscriptionId) {
        console.error(`No subscription ID found for phone number ${number}`);
        alert(
          "Could not cancel subscription: No subscription ID found for this number."
        );
        return;
      }

      // Call the API to cancel the subscription
      const response = await fetch("/api/phone-numbers/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: number,
          subscriptionId,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.details || "Failed to cancel subscription"
        );
      }

      // Update the UI to reflect the cancellation
      // Option 1: Refetch the phone numbers
      const refreshedNumbers = await getUserPhoneNumbersWithSubscriptions(
        user.id
      );
      setPhoneNumberSubscriptions(refreshedNumbers);
      setPhoneNumbers(Array.from(refreshedNumbers.keys()));

      // Alternatively, just remove the canceled number directly from state
      // setPhoneNumbers(phoneNumbers.filter(num => num !== number));
      // const updatedSubscriptions = new Map(phoneNumberSubscriptions);
      // updatedSubscriptions.delete(number);
      // setPhoneNumberSubscriptions(updatedSubscriptions);

      alert("Phone number removed successfully");
    } catch (error: any) {
      console.error("Error canceling phone number:", error);
      alert(
        `Failed to cancel subscription: ${error.message || "Unknown error"}`
      );
    } finally {
      setCancellingNumber(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Numbers</h1>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Numbers</h1>
          <div className="bg-white shadow-md rounded-lg p-6">
            <p className="text-center text-gray-700">
              Please sign in to view your phone numbers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Numbers</h1>

        {phoneNumbers.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-6">
            <p className="text-center text-gray-700">
              You don&apos;t have any phone numbers yet.
            </p>
            <div className="mt-4 text-center">
              <a
                href="/purchase-local-number"
                className="inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Purchase a number
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Your Phone Numbers
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                These are the phone numbers associated with your account.
              </p>
            </div>
            <ul className="divide-y divide-gray-200">
              {phoneNumbers.map((number, index) => (
                <li key={index} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {number}
                    </p>
                    <div className="flex items-center space-x-3">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                      <button
                        onClick={() => handleCallUsingNumber(number)}
                        className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-md transition-colors"
                      >
                        Call using this number
                      </button>
                      <button
                        onClick={() => handleCancelThisNumber(number)}
                        disabled={cancellingNumber === number}
                        className={`${
                          cancellingNumber === number
                            ? "bg-gray-400"
                            : "bg-red-500 hover:bg-red-600"
                        } px-3 py-1 text-white text-sm font-medium rounded-md transition-colors flex items-center`}
                      >
                        {cancellingNumber === number ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Cancelling...
                          </>
                        ) : (
                          "Cancel this number"
                        )}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
