"use client";

import Link from "next/link";

export default function CancelPage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="mb-8 text-yellow-500">
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
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h1 className="text-3xl font-bold mb-4">Payment Cancelled</h1>
      <p className="mb-8">
        Your payment process was cancelled. No charges were made to your
        account.
      </p>
      <div className="flex justify-center space-x-4">
        <Link
          href="/credits"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition-colors"
        >
          Try Again
        </Link>
        <Link
          href="/"
          className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
