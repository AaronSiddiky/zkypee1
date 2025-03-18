"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getUserPhoneNumbers } from "@/lib/phoneNumbers";

export default function DebugPhoneNumbers() {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("+1");
  const [userPhoneNumbers, setUserPhoneNumbers] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("");
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    const loadPhoneNumbers = async () => {
      if (user?.id) {
        try {
          const numbers = await getUserPhoneNumbers(user.id);
          setUserPhoneNumbers(numbers);
        } catch (error) {
          console.error("Error loading phone numbers:", error);
        }
      }
    };

    loadPhoneNumbers();
  }, [user?.id]);

  const handleAddNumber = async () => {
    if (!user) {
      setStatus("Error: You need to be logged in");
      return;
    }

    if (!phoneNumber.startsWith("+")) {
      setStatus("Error: Phone number must start with +");
      return;
    }

    setStatus("Testing...");

    try {
      // Call our debug endpoint to test different update methods
      const response = await fetch("/api/debug/update-phone-numbers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          phoneNumber,
        }),
      });

      const data = await response.json();
      console.log("Debug response:", data);
      setResults(data);

      if (data.success) {
        setStatus("Success! Phone number added to your account.");

        // Refresh the phone numbers list
        const numbers = await getUserPhoneNumbers(user.id);
        setUserPhoneNumbers(numbers);
      } else {
        setStatus(`Error: ${data.message || "Failed to add phone number"}`);
      }
    } catch (error) {
      console.error("Error testing update:", error);
      setStatus(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Debug Phone Numbers</h1>

      {!user && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          You need to be logged in to test this functionality.
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Current Phone Numbers</h2>
        {userPhoneNumbers.length > 0 ? (
          <ul className="list-disc pl-5 mb-4">
            {userPhoneNumbers.map((number, index) => (
              <li key={index} className="mb-1">
                {number}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 mb-4">
            No phone numbers found for your account.
          </p>
        )}

        <div className="mb-4">
          <label
            htmlFor="phoneNumber"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Test Phone Number
          </label>
          <input
            type="text"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="+1234567890"
          />
        </div>

        <button
          onClick={handleAddNumber}
          disabled={!user}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          Test Adding Number
        </button>

        {status && (
          <div
            className={`mt-4 p-3 rounded ${
              status.startsWith("Error")
                ? "bg-red-100 text-red-700"
                : status.startsWith("Success")
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {status}
          </div>
        )}

        {results && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Debug Results:</h3>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Troubleshooting Steps</h2>
        <ul className="list-disc pl-5">
          <li className="mb-2">
            Check if the Supabase service role key is properly set in your
            environment variables
          </li>
          <li className="mb-2">
            Verify Row Level Security (RLS) policies for the users table in
            Supabase
          </li>
          <li className="mb-2">
            Ensure the <code>purchased_phone_numbers</code> column exists and is
            of type <code>text[]</code>
          </li>
          <li className="mb-2">
            Check server logs for detailed error messages
          </li>
        </ul>
      </div>
    </div>
  );
}
