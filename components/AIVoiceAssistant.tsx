import React, { useState } from "react";

interface AIVoiceAssistantProps {
  twilioNumber: string;
  onMakeCall: (
    prompt: string,
    phoneNumber: string,
    voice?: string
  ) => Promise<any>;
}

export default function AIVoiceAssistant({
  twilioNumber,
  onMakeCall,
}: AIVoiceAssistantProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const result = await onMakeCall(
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
      const maxPolls = 30; // Maximum number of polling attempts
      const pollCall = async () => {
        try {
          if (!result.callId || pollCount >= maxPolls) {
            return;
          }

          pollCount++;
          console.log(
            `Polling call status (attempt ${pollCount}/${maxPolls})...`
          );

          const statusResult = await fetch(
            `/api/bland-ai?callId=${result.callId}`
          ).then((r) => r.json());
          console.log("Poll result:", statusResult);

          if (
            statusResult.status === "completed" ||
            statusResult.status === "failed"
          ) {
            setCallStatus(
              statusResult.status === "completed" ? "completed" : "failed"
            );

            // Update the call result with whatever data we have
            setCallResult((prev) => ({
              ...(prev || { callId: result.callId }),
              recording: statusResult.recording || null,
              transcript: statusResult.transcript || "No transcript available",
              summary: statusResult.summary || "No summary available",
            }));

            // If we have a status but no recording/transcript yet, try one more time after a delay
            if (
              statusResult.status === "completed" &&
              (!statusResult.recording || !statusResult.transcript)
            ) {
              setTimeout(async () => {
                try {
                  const finalResult = await fetch(
                    `/api/bland-ai?callId=${result.callId}`
                  ).then((r) => r.json());
                  if (finalResult.recording || finalResult.transcript) {
                    setCallResult((prev) => ({
                      ...(prev || { callId: result.callId }),
                      recording:
                        finalResult.recording || prev?.recording || null,
                      transcript:
                        finalResult.transcript ||
                        prev?.transcript ||
                        "No transcript available",
                      summary:
                        finalResult.summary ||
                        prev?.summary ||
                        "No summary available",
                    }));
                  }
                } catch (finalError) {
                  console.error("Error in final poll:", finalError);
                }
              }, 10000); // Wait 10 seconds for final check
            }

            return; // Stop polling
          }

          // Calculate next poll interval with exponential backoff
          const nextInterval = Math.min(2000 * Math.pow(1.5, pollCount), 30000); // Cap at 30 seconds
          setTimeout(pollCall, nextInterval);
        } catch (pollError) {
          console.error("Error polling call status:", pollError);
          // Try again after a delay unless we've reached max attempts
          if (pollCount < maxPolls) {
            setTimeout(pollCall, 5000);
          }
        }
      };

      // Start polling
      setTimeout(pollCall, 3000); // Initial delay before first poll
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        AI Voice Assistant
      </h2>
      <p className="text-gray-600 mb-4">
        The AI will call the number you specify using BlandAI's phone system
        with the "Cailee" voice and follow your instructions.
      </p>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
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

        <div className="mb-4">
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

        <div className="mb-4">
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
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
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
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            isProcessing || callStatus === "in-progress"
              ? "bg-blue-400"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
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
            </div>
          ) : callStatus === "in-progress" ? (
            "Call in progress..."
          ) : (
            "Make AI Call"
          )}
        </button>
      </form>

      {callStatus !== "idle" && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center mb-3">
            <h3 className="text-lg font-medium text-gray-800">Call Status: </h3>
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
            <div className="space-y-4">
              {callResult.summary && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Summary</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded">
                    {callResult.summary}
                  </p>
                </div>
              )}

              {callResult.transcript &&
              callResult.transcript !== "No transcript available" ? (
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Transcript</h4>
                  <div className="bg-gray-50 p-3 rounded max-h-60 overflow-y-auto">
                    {callResult.transcript.split("\n\n").map((exchange, i) => (
                      <div key={i} className="mb-2">
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
                  <h4 className="font-medium text-gray-700 mb-1">Transcript</h4>
                  <p className="text-gray-500 italic bg-gray-50 p-3 rounded">
                    Transcript not available. BlandAI may still be processing
                    the call recording.
                  </p>
                </div>
              )}

              {callResult.recording ? (
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Recording</h4>
                  <audio controls className="w-full" src={callResult.recording}>
                    Your browser does not support the audio element.
                  </audio>
                </div>
              ) : (
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Recording</h4>
                  <p className="text-gray-500 italic bg-gray-50 p-3 rounded">
                    Recording not available. BlandAI may still be processing the
                    call recording.
                  </p>
                </div>
              )}

              <div className="mt-2 text-sm text-gray-500">
                <p>
                  Note: Recordings and transcripts may take a few minutes to
                  process after the call completes.
                </p>
              </div>
            </div>
          )}

          {callStatus === "completed" && (
            <button
              onClick={handleManualRefresh}
              disabled={isProcessing}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center justify-center"
            >
              {isProcessing ? (
                <span>Refreshing...</span>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
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
          )}
        </div>
      )}
    </div>
  );
}
