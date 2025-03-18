import React, { useState, useEffect } from "react";
import Button from "./Button";
import { fetchAvailableNumbers } from "../lib/twilio";
import { useAuth } from "../contexts/AuthContext";

// Define interface for purchased phone number returned from API
interface PurchasedPhoneNumberResponse {
  success?: boolean;
  phoneNumber?: string;
  sid?: string;
  friendlyName?: string;
  dateCreated?: string;
  capabilities?: {
    voice?: boolean;
    sms?: boolean;
    mms?: boolean;
  };
  // Error response properties
  error?: string;
  details?: string;
  code?: string;
  savedToAccount?: boolean;
}

interface NumberListProps {
  countryCode: string;
  onPurchaseSuccess?: (purchasedNumber: PurchasedPhoneNumberResponse) => void;
}

interface PhoneNumber {
  phoneNumber: string;
  friendlyName: string;
  numberType?: string;
  locality?: string;
  region?: string;
  price: number;
  capabilities?: {
    voice?: boolean;
    sms?: boolean;
    mms?: boolean;
  };
}

export default function NumberList({
  countryCode,
  onPurchaseSuccess,
}: NumberListProps) {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<PhoneNumber | null>(
    null
  );
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<
    "idle" | "loading" | "success" | "error" | "db-warning"
  >("idle");
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchasedNumber, setPurchasedNumber] = useState<any | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function loadNumbers() {
      try {
        setLoading(true);
        setSelectedNumber(null); // Reset selected number when country changes
        setPurchaseStatus("idle");
        setPurchaseError(null);
        setPurchasedNumber(null);

        const availableNumbers = await fetchAvailableNumbers(countryCode);
        setNumbers(availableNumbers);
      } catch (err) {
        console.error(`Failed to load numbers for ${countryCode}:`, err);
        setError("Failed to load available numbers. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadNumbers();
  }, [countryCode]);

  function handleSelectNumber(number: PhoneNumber) {
    setSelectedNumber(number);
    setShowConfirmation(true);
  }

  async function handlePurchaseNumber() {
    if (!selectedNumber) return;

    try {
      setPurchaseStatus("loading");
      setPurchaseError(null);

      console.log(
        "Initiating payment for phone number:",
        selectedNumber.phoneNumber
      );

      // Check if user is available
      if (!user) {
        console.error("No authenticated user found");
        throw new Error(
          "Authentication required. Please sign in to purchase a number."
        );
      }

      console.log("Creating checkout session with user ID:", user.id);

      // Create a Stripe checkout session for the phone number
      const response = await fetch("/api/phone-numbers/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: selectedNumber.phoneNumber,
          friendlyName: selectedNumber.friendlyName,
          price: selectedNumber.price * 3 || 30, // Default price if not set, tripled
          userId: user.id,
        }),
      });

      const data = await response.json();
      console.log("Checkout API response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe checkout
      if (data.url) {
        console.log("Redirecting to Stripe checkout:", data.url);
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }

      // The rest of the purchase flow will be handled after payment in the success page
    } catch (err: any) {
      console.error("Error initiating payment:", err);
      setPurchaseStatus("error");
      setPurchaseError(err.message || "Failed to initiate payment");
      setShowConfirmation(false);
    }
  }

  function handleCloseModals() {
    setShowConfirmation(false);
    if (purchaseStatus === "success" || purchaseStatus === "error") {
      setPurchaseStatus("idle");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (numbers.length === 0) {
    return (
      <div className="text-center py-8 bg-yellow-50 border border-yellow-100 rounded-lg p-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 mx-auto text-yellow-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 className="text-lg font-medium text-yellow-800 mb-2">
          No Numbers Available
        </h3>
        <p className="text-yellow-600">
          Twilio doesn't currently have any phone numbers available for this
          country. Please try selecting a different country.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Success Message */}
      {purchaseStatus === "success" && purchasedNumber && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-green-500"
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
            </div>
            <h3 className="text-lg font-medium text-center text-gray-900 mb-2">
              Purchase Successful!
            </h3>
            <p className="text-center mb-4">
              {purchasedNumber.phoneNumber} has been added to your account.
            </p>
            <div className="flex justify-center">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={handleCloseModals}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DB Warning Modal */}
      {purchaseStatus === "db-warning" && purchasedNumber && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-yellow-100 p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-yellow-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-medium text-center text-gray-900 mb-2">
              Purchase Partially Successful
            </h3>
            <p className="text-center mb-2">
              The number was purchased successfully but there was an issue
              saving it to your account database.
            </p>
            <p className="text-center text-sm text-gray-500 mb-4">
              Your phone number ({purchasedNumber.phoneNumber}) is still
              reserved for you and will appear in your account soon.
            </p>
            <div className="flex justify-center">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={handleCloseModals}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {purchaseStatus === "error" && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-medium">Failed to purchase number</p>
          <p>{purchaseError}</p>
        </div>
      )}

      {/* Numbers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {numbers.map((number) => (
          <div
            key={number.phoneNumber}
            className={`border rounded-lg p-4 transition-all duration-200 ${
              selectedNumber?.phoneNumber === number.phoneNumber
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <p className="font-medium text-lg">{number.friendlyName}</p>
              <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                {number.numberType || "Local"}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-2">
              {number.locality || number.region || "Unknown location"}
            </p>

            {/* Capabilities */}
            <div className="flex space-x-2 mb-3">
              {number.capabilities?.voice && (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  Voice
                </span>
              )}
              {number.capabilities?.sms && (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  SMS
                </span>
              )}
              {number.capabilities?.mms && (
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                  MMS
                </span>
              )}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-blue-500 font-medium">
                ${(number.price * 3).toFixed(2)}/month
              </span>
              <Button
                variant="primary"
                size="small"
                onClick={() => handleSelectNumber(number)}
              >
                Buy
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Purchase Confirmation Modal */}
      {showConfirmation && selectedNumber && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Purchase
            </h3>
            <p className="mb-2">
              Are you sure you want to purchase this number?
            </p>
            <p className="font-medium text-lg mb-1">
              {selectedNumber.friendlyName}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {selectedNumber.locality ||
                selectedNumber.region ||
                "Unknown location"}{" "}
              • ${(selectedNumber.price * 3).toFixed(2)}/month
            </p>

            <div className="text-sm text-gray-500 mb-6">
              <p>
                This number will be associated with your account and you will be
                billed ${(selectedNumber.price * 3).toFixed(2)} monthly.
              </p>
            </div>

            <div className="flex space-x-3 justify-end">
              <Button
                variant="secondary"
                size="small"
                onClick={handleCloseModals}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={handlePurchaseNumber}
                loading={purchaseStatus === "loading"}
              >
                Confirm Purchase
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
