"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SuccessPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      router.push("/credits");
      return;
    }

    const processPayment = async () => {
      try {
        setIsLoading(true);
        console.log(`Processing payment with session ID: ${sessionId}`);

        // Call the success API endpoint to process the payment
        const response = await fetch(
          `/api/credits/success?session_id=${encodeURIComponent(sessionId)}`,
          {
            credentials: "include", // Include credentials for auth
          }
        );

        // Now the API returns a JSON response instead of redirecting
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          // Handle non-200 responses
          console.error("Error response:", data);
          const statusText = response.statusText || `HTTP ${response.status}`;
          throw new Error(
            data?.error || `Failed to process payment (${statusText})`
          );
        }

        // Check if the API response contains a redirect instruction
        if (data && data.redirectTo) {
          console.log(`API indicates redirect to: ${data.redirectTo}`);

          // Set success to show success UI briefly
          setSuccess(true);

          // Redirect to thank-you page after a brief delay
          setTimeout(() => {
            router.push(data.redirectTo);
          }, 1000);
          return;
        }

        setSuccess(true);
        // If no redirect in response, still go to thank-you page
        setTimeout(() => {
          router.push("/credits/thank-you");
        }, 1000);
      } catch (err) {
        console.error("Error processing payment:", err);
        let errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";

        // Try to get more details if available
        if (err instanceof Error) {
          setErrorDetails(err.stack || null);
        }

        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    processPayment();
  }, [sessionId, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Processing Your Payment</h1>
        <p className="mb-8">Please wait while we confirm your payment...</p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <p className="mt-8 text-sm text-gray-500">Session ID: {sessionId}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Payment Error</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8 inline-block">
          {error === "Unauthorized" ? "Authentication error" : error}
        </div>
        <p className="mb-8">
          There was a problem processing your payment. Please try again or
          contact support.
        </p>
        {errorDetails && (
          <details className="mb-8 text-left mx-auto max-w-2xl">
            <summary className="cursor-pointer text-sm text-gray-600">
              Technical details
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto text-xs">
              {errorDetails}
            </pre>
          </details>
        )}
        <p className="mb-8 text-sm text-gray-500">Session ID: {sessionId}</p>
        <Link
          href="/credits"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition-colors"
        >
          Return to Credits Page
        </Link>
      </div>
    );
  }

  // This is a backup success message that shows while redirecting
  // to the thank-you page
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
      <p className="mb-8">
        Thank you for your purchase. Redirecting to your account...
      </p>
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
      <p className="mt-8 text-sm text-gray-500">Session ID: {sessionId}</p>
    </div>
  );
}
