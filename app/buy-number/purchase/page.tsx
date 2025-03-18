"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "../../../components/Button";
import {
  fetchAvailableCountries,
  fetchAvailableNumbers,
} from "../../../lib/twilio";
import { useAuth } from "../../../contexts/AuthContext";
import NumberList from "../../../components/NumberList";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { getUserPhoneNumbers } from "@/lib/phoneNumbers";

// Define a component to display purchased phone numbers
function PurchasedNumbers({ numbers }: { numbers: string[] }) {
  if (!numbers || numbers.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
      <h3 className="text-lg font-medium text-blue-800 mb-2">
        Your Phone Numbers
      </h3>
      <p className="text-sm text-gray-600 mb-3">
        You already have the following phone numbers in your account:
      </p>
      <div className="grid gap-2">
        {numbers.map((phoneNumber: string, index: number) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 bg-white rounded border border-blue-100"
          >
            <div>
              <p className="font-medium">{phoneNumber}</p>
            </div>
            <div className="flex items-center">
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                Active
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Define step types
type Step = "country" | "number" | "success";

export default function PurchaseNumberPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>("country");
  const [countries, setCountries] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [purchasedNumber, setPurchasedNumber] = useState<any>(null);
  const [userPhoneNumbers, setUserPhoneNumbers] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Check if user is authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin?redirect=/buy-number/purchase");
    }
  }, [user, authLoading, router]);

  // Load countries and user's existing phone numbers on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch available countries
        const countriesResponse = await fetch(
          "/api/twilio/available-countries"
        );
        const countriesData = await countriesResponse.json();
        setCountries(countriesData.countries || []);

        // Check if user is logged in
        const {
          data: { user },
        } = await createClientComponentClient().auth.getUser();

        if (user) {
          setUserId(user.id);

          // Use our new utility function to get user's phone numbers
          const userPhoneNumbers = await getUserPhoneNumbers(user.id);
          setUserPhoneNumbers(userPhoneNumbers);

          // Check for success status and phone number in URL parameters
          const params = new URLSearchParams(window.location.search);
          const status = params.get("status");
          const phoneFromParams = params.get("phone");

          if (status === "success" && phoneFromParams) {
            console.log(
              `Purchase success detected for phone number: ${phoneFromParams}`
            );
            setPurchasedNumber({ phoneNumber: phoneFromParams });
            setCurrentStep("success");

            // Refresh phone numbers to ensure we have the latest
            const refreshedPhoneNumbers = await getUserPhoneNumbers(user.id);
            setUserPhoneNumbers(refreshedPhoneNumbers);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter countries based on search query
  const filteredCountries = countries.filter(
    (country) =>
      country.countryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.countryCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle country selection
  const handleCountrySelect = (country: any) => {
    setSelectedCountry(country);
    setCurrentStep("number");
    // Scroll to top when changing steps
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle successful purchase
  const handlePurchaseSuccess = async (number: any) => {
    setPurchasedNumber(number);
    // Add the new number to our local state
    setUserPhoneNumbers((prev) => [...prev, number.phoneNumber]);
    setCurrentStep("success");
    // Scroll to top when changing steps
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Refresh user phone numbers
    try {
      if (userId) {
        const updatedPhoneNumbers = await getUserPhoneNumbers(userId);
        setUserPhoneNumbers(updatedPhoneNumbers);
      }
    } catch (error) {
      console.error("Error refreshing phone numbers:", error);
    }
  };

  // Render loading state
  if (authLoading || (loading && currentStep === "country")) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <Button href="/buy-number" variant="primary">
          Back to Number Selection
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === "country"
                  ? "bg-blue-500 text-white"
                  : "bg-blue-100 text-blue-500"
              }`}
            >
              1
            </div>
            <div className="ml-2 font-medium">Select Country</div>
          </div>
          <div className="h-px bg-gray-300 flex-grow mx-4"></div>
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === "number"
                  ? "bg-blue-500 text-white"
                  : "bg-blue-100 text-blue-500"
              }`}
            >
              2
            </div>
            <div className="ml-2 font-medium">Choose Number</div>
          </div>
          <div className="h-px bg-gray-300 flex-grow mx-4"></div>
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === "success"
                  ? "bg-blue-500 text-white"
                  : "bg-blue-100 text-blue-500"
              }`}
            >
              3
            </div>
            <div className="ml-2 font-medium">Complete</div>
          </div>
        </div>
      </div>

      {/* Show existing purchased numbers if user has any */}
      {userPhoneNumbers.length > 0 && currentStep === "country" && (
        <PurchasedNumbers numbers={userPhoneNumbers} />
      )}

      {/* Country selection step */}
      {currentStep === "country" && (
        <>
          <h1 className="text-3xl font-bold mb-6 text-blue-500">
            Get a US Phone Number
          </h1>
          <p className="mb-6">
            We currently offer phone numbers in the United States only:
          </p>

          {/* Country grid - will now only show the US */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <div
                  key={country.countryCode}
                  className="border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-blue-300 hover:bg-blue-50"
                  onClick={() => handleCountrySelect(country)}
                >
                  <div className="flex items-center space-x-3">
                    {country.flagUrl && (
                      <div className="w-8 h-6 relative overflow-hidden rounded">
                        <img
                          src={country.flagUrl}
                          alt={`${country.countryName} flag`}
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium">{country.countryName}</h3>
                      <p className="text-sm text-gray-500">
                        {country.countryCode}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                No countries found matching your search.
              </div>
            )}
          </div>
        </>
      )}

      {/* Number selection step */}
      {currentStep === "number" && selectedCountry && (
        <>
          <div className="mb-6">
            <button
              onClick={() => setCurrentStep("country")}
              className="text-blue-500 hover:text-blue-700 flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Countries
            </button>
          </div>

          <h1 className="text-3xl font-bold mb-2 text-blue-500">
            Select a US Phone Number
          </h1>
          <p className="mb-6 text-gray-600">
            Choose from available US phone numbers below
          </p>

          {/* Number List Component */}
          <NumberList
            countryCode={selectedCountry.countryCode}
            onPurchaseSuccess={handlePurchaseSuccess}
          />
        </>
      )}

      {/* Purchase success step */}
      {currentStep === "success" && purchasedNumber && (
        <div className="text-center py-8">
          <div className="mb-6 inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-green-500"
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
          <h1 className="text-3xl font-bold mb-4 text-green-600">
            Purchase Successful!
          </h1>
          <p className="text-xl mb-2">{purchasedNumber.phoneNumber}</p>
          <p className="text-gray-600 mb-8">
            Your new phone number has been added to your account
          </p>

          {/* Show all user's phone numbers */}
          {userPhoneNumbers.length > 0 && (
            <div className="max-w-md mx-auto mb-8">
              <PurchasedNumbers numbers={userPhoneNumbers} />
            </div>
          )}

          <div className="max-w-md mx-auto bg-blue-50 rounded-lg p-6 mb-8 text-left">
            <h3 className="text-lg font-medium text-blue-800 mb-2">
              Next Steps
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-500 mr-2 mt-0.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Configure your number in your account settings</span>
              </li>
              <li className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-500 mr-2 mt-0.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Set up forwarding and messaging preferences</span>
              </li>
              <li className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-500 mr-2 mt-0.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Start making and receiving calls</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
            <Button href="/setup" variant="primary" size="large">
              Set Up Your Number
            </Button>
            <Button href="/dashboard" variant="secondary" size="large">
              Go to Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
