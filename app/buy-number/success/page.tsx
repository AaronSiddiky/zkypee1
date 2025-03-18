"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Button from "../../../components/Button";

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Invalid session ID");
      setLoading(false);
      return;
    }

    async function processPayment() {
      try {
        setLoading(true);

        console.log("Processing payment with session ID:", sessionId);

        // Call our success API endpoint to verify payment and complete the purchase
        const response = await fetch(
          `/api/phone-numbers/success?session_id=${sessionId}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to process payment");
        }

        console.log(
          "Payment processed successfully, redirecting to:",
          data.redirectTo
        );

        // Redirect to the purchase page with success status
        router.push(data.redirectTo || "/");
      } catch (err: any) {
        console.error("Error processing payment:", err);
        setError(err.message || "Failed to process payment");
        setLoading(false);
      }
    }

    processPayment();
  }, [sessionId, router]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-center mb-6">Payment Error</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
          </div>
          <div className="mt-4 flex justify-center">
            <Button href="/buy-number/purchase" variant="primary">
              Back to Number Selection
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">
          Processing Your Purchase
        </h1>
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">
            We're completing your phone number purchase. Please wait...
          </p>
        </div>
      </div>
    </div>
  );
}
