"use client";

import React from "react";
import Link from "next/link";
import Button from "../../../components/Button";

export default function CancelPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg text-center">
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-4">Payment Cancelled</h1>
        <p className="text-gray-600 mb-6">
          Your phone number purchase has been cancelled. No charges have been
          made.
        </p>
        <Button href="/buy-number/purchase" variant="primary">
          Back to Number Selection
        </Button>
      </div>
    </div>
  );
}
