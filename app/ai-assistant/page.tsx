"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import Auth from "../../components/Auth";

export default function AIAssistantPage() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [callStatus, setCallStatus] = useState<
    "idle" | "scheduled" | "in-progress" | "completed" | "failed"
  >("idle");
  const [callResult, setCallResult] = useState<{
    callId?: string;
    recording?: string;
    transcript?: string;
    summary?: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("cailee");
  const [twilioNumber, setTwilioNumber] = useState<string | null>(null);

  // Add this function to format phone numbers
  const formatPhoneNumber = (number: string): string => {
    // Remove any non-digit characters
    const digits = number.replace(/\D/g, "");

    // If it's a US number without country code, add +1
    if (digits.length === 10) {
      return `+1${digits}`;
    }

    // If it already has country code but missing +
    if (digits.length > 10 && !number.startsWith("+")) {
      return `+${digits}`;
    }

    // If it already has + but contains non-digits, clean it up
    if (number.startsWith("+")) {
      return `+${digits}`;
    }

    return number;
  };

  // Fetch the Twilio phone number
  React.useEffect(() => {
    const fetchTwilioNumber = async () => {
      try {
        const response = await fetch("/api/twilio/phone-number");
        if (response.ok) {
          const data = await response.json();
          if (data.phoneNumber) {
            setTwilioNumber(data.phoneNumber);
          }
        }
      } catch (error) {
        console.error("Error fetching Twilio number:", error);
      }
    };

    if (user) {
      fetchTwilioNumber();
    }
  }, [user]);

  const handleAICall = async (
    prompt: string,
    phoneNumber: string,
    voice: string = "cailee"
  ) => {
    try {
      const response = await fetch("/api/bland-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          phoneNumber,
          voice,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to schedule AI call");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error making AI call:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("Please sign in to use the AI Voice Assistant");
      return;
    }

    if (!prompt.trim()) {
      setError("Please enter instructions for the AI assistant");
      return;
    }

    if (!phoneNumber.trim()) {
      setError("Please enter a phone number to call");
      return;
    }

    setError("");
    setIsProcessing(true);
    setCallStatus("scheduled");

    try {
      // Format the phone number
      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

      // Call the BlandAI API through your backend
      const result = await handleAICall(
        prompt,
        formattedPhoneNumber,
        selectedVoice
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to schedule call");
      }

      setCallResult(result);
      setCallStatus("in-progress");

      // Poll for updates with exponential backoff
      let pollCount = 0;
      const maxPolls = 30;
      const pollInterval = 2000; // Start with 2 seconds

      const pollForUpdates = async () => {
        if (pollCount >= maxPolls) {
          console.log("Max polls reached");
          return;
        }

        try {
          const response = await fetch(
            `/api/bland-ai?callId=${result.callId}`
          ).then((r) => r.json());

          if (response.status === "completed") {
            setCallStatus("completed");
            setCallResult(response);
            return;
          }

          pollCount++;
          setTimeout(
            pollForUpdates,
            pollInterval * Math.pow(1.5, pollCount) // Exponential backoff
          );
        } catch (error) {
          console.error("Error polling for updates:", error);
        }
      };

      pollForUpdates();
    } catch (err) {
      console.error("Error making AI call:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "details" in err
          ? String(err.details)
          : "Failed to initiate call. Please try again.";

      setError(errorMessage);
      setCallStatus("failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualRefresh = async () => {
    if (!callResult?.callId) return;

    try {
      setIsProcessing(true);
      const refreshResult = await fetch(
        `/api/bland-ai?callId=${callResult.callId}`
      ).then((r) => r.json());

      setCallResult((prev) => ({
        ...(prev || { callId: callResult.callId }),
        recording: refreshResult.recording || prev?.recording || null,
        transcript:
          refreshResult.transcript ||
          prev?.transcript ||
          "No transcript available",
        summary:
          refreshResult.summary || prev?.summary || "No summary available",
      }));
    } catch (error) {
      console.error("Error refreshing call data:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-4">
          <span className="text-black">AI Voice </span>
          <span className="text-blue-500">Assistant</span>
        </h1>
        <p className="text-gray-600 mt-4">
          Experience smarter conversations with our AI-powered voice assistant
        </p>
      </motion.div>

      <motion.div
        className="bg-white rounded-lg shadow-lg p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number to Call
            </label>
            <input
              type="tel"
              id="phoneNumber"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+1 (555) 123-4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isProcessing || callStatus === "in-progress"}
            />
          </div>

          <div>
            <label
              htmlFor="prompt"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Instructions for the AI
            </label>
            <textarea
              id="prompt"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Call this Korean BBQ restaurant and ask if they cook the meat for customers. Also ask about their prices and if reservations are required."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isProcessing || callStatus === "in-progress"}
            />
          </div>

          <div>
            <label
              htmlFor="voice"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              AI Voice
            </label>
            <select
              id="voice"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              disabled={isProcessing || callStatus === "in-progress"}
            >
              <option value="cailee">Cailee (Female)</option>
              <option value="emma">Emma (Female)</option>
              <option value="josh">Josh (Male)</option>
              <option value="ray">Ray (Male)</option>
              <option value="dave">Dave (Male)</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              isProcessing ||
              callStatus === "in-progress" ||
              !prompt.trim() ||
              !phoneNumber.trim()
            }
            className={`w-full py-3 px-4 rounded-full text-white font-medium flex items-center justify-center ${
              isProcessing || callStatus === "in-progress"
                ? "bg-blue-400"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isProcessing ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                Processing...
              </>
            ) : callStatus === "in-progress" ? (
              "Call in progress..."
            ) : (
              <>
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
                Make AI Call
              </>
            )}
          </button>
        </form>

        {callStatus !== "idle" && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="flex items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">
                Call Status:{" "}
              </h3>
              <span
                className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  callStatus === "scheduled"
                    ? "bg-yellow-100 text-yellow-800"
                    : callStatus === "in-progress"
                    ? "bg-blue-100 text-blue-800"
                    : callStatus === "completed"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {callStatus === "scheduled"
                  ? "Scheduled"
                  : callStatus === "in-progress"
                  ? "In Progress"
                  : callStatus === "completed"
                  ? "Completed"
                  : "Failed"}
              </span>
            </div>

            {callStatus === "completed" && callResult && (
              <div className="space-y-6">
                {callResult.summary && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Summary</h4>
                    <p className="text-gray-600 bg-gray-50 p-4 rounded-md">
                      {callResult.summary}
                    </p>
                  </div>
                )}

                {callResult.transcript &&
                callResult.transcript !== "No transcript available" ? (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">
                      Transcript
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-md max-h-60 overflow-y-auto">
                      {callResult.transcript
                        .split("\n\n")
                        .map((exchange, i) => (
                          <div key={i} className="mb-3">
                            {exchange.split("\n").map((line, j) => (
                              <p key={j} className="text-gray-600">
                                {line}
                              </p>
                            ))}
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">
                      Transcript
                    </h4>
                    <p className="text-gray-500 italic bg-gray-50 p-4 rounded-md">
                      Transcript not available. BlandAI may still be processing
                      the call recording.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleManualRefresh}
                  disabled={isProcessing}
                  className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center justify-center"
                >
                  {isProcessing ? (
                    "Refreshing..."
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Refresh Call Data
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
