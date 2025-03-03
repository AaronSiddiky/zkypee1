"use client";

import React, { useState } from "react";
import { useTwilio } from "../contexts/TwilioContext";
import { useAuth } from "../contexts/AuthContext";

interface TestConnectionButtonProps {
  className?: string;
}

export default function TestConnectionButton({
  className = "",
}: TestConnectionButtonProps) {
  const { testConnection, device, initializeDevice } = useTwilio();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Function to safely get device state
  const getDeviceState = (): string => {
    if (!device) return "null";
    try {
      return (device as any).status ? (device as any).status() : "unknown";
    } catch (err: any) {
      return `error_getting_status: ${err.message || "unknown error"}`;
    }
  };

  const handleTestConnection = async () => {
    setStatus("Testing connection...");
    setIsLoading(true);
    setDetails(null);
    setShowDetails(false);

    try {
      // Check authentication status first
      if (authLoading) {
        setStatus("Authentication is still loading. Please wait...");
        setIsLoading(false);
        return false;
      }

      if (!user || !user.id) {
        setStatus(
          "You must be signed in to test the connection. Please sign in first."
        );
        setIsLoading(false);
        return false;
      }

      // Check if testConnection function is available
      if (typeof testConnection !== "function") {
        throw new Error("Twilio context not available");
      }

      // Log current device state
      console.log("Current device state before test:", getDeviceState());

      // Use the improved testConnection function
      const result = await testConnection();

      // Store the full result for detailed view
      setDetails(result);

      if (result && result.success) {
        setStatus(
          `Connection test successful! Device status: ${
            result.deviceStatus
          }, Ready: ${result.isReady ? "Yes" : "No"}`
        );
        return true;
      } else if (result) {
        // Handle specific error cases
        const errorMessage = result.error || "Connection test failed";
        console.error("Connection test failed:", errorMessage);

        // If device is null, suggest initialization
        if (
          result.deviceStatus === "null" ||
          result.deviceStatus === "no_device"
        ) {
          setStatus(`Device not initialized. Try initializing the device.`);
          return false;
        }

        // If device is in destroyed state, suggest recreation
        if (result.deviceStatus === "destroyed") {
          setStatus(`Device is in destroyed state. Try reinitializing.`);
          return false;
        }

        setStatus(`Connection test error: ${errorMessage}`);
        return false;
      } else {
        setStatus("Connection test failed. Please check console for details.");
        return false;
      }
    } catch (err: any) {
      console.error("Connection test error:", err);
      setStatus(`Connection test error: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitializeDevice = async () => {
    setStatus("Initializing device...");
    setIsLoading(true);

    try {
      // Check authentication status first
      if (authLoading) {
        setStatus("Authentication is still loading. Please wait...");
        setIsLoading(false);
        return false;
      }

      if (!user || !user.id) {
        setStatus(
          "You must be signed in to initialize the device. Please sign in first."
        );
        setIsLoading(false);
        return false;
      }

      if (typeof initializeDevice !== "function") {
        throw new Error("Twilio context not available");
      }

      const result = await initializeDevice();
      if (result) {
        setStatus("Device initialized successfully!");
      } else {
        setStatus("Failed to initialize device. Check console for details.");
      }
    } catch (err: any) {
      console.error("Device initialization error:", err);
      setStatus(`Initialization error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {authLoading && (
        <div className="text-sm text-amber-500 mb-2">
          Authentication is loading... Please wait.
        </div>
      )}

      {!authLoading && !user && (
        <div className="text-sm text-red-500 mb-2">
          You must be signed in to use Twilio features. Please sign in first.
        </div>
      )}

      <div className="flex space-x-2">
        <button
          onClick={handleTestConnection}
          className={`text-sm ${
            isLoading || authLoading || !user
              ? "text-gray-400 cursor-not-allowed"
              : "text-blue-500 hover:text-blue-700"
          } focus:outline-none flex items-center px-2 py-1 rounded-md border border-blue-200`}
          disabled={isLoading || authLoading || !user}
        >
          {isLoading && (
            <div className="w-3 h-3 border-t-transparent border-2 border-blue-500 rounded-full animate-spin mr-2"></div>
          )}
          Test Connection
        </button>

        <button
          onClick={handleInitializeDevice}
          className={`text-sm ${
            isLoading || authLoading || !user
              ? "text-gray-400 cursor-not-allowed"
              : "text-green-500 hover:text-green-700"
          } focus:outline-none flex items-center px-2 py-1 rounded-md border border-green-200`}
          disabled={isLoading || authLoading || !user}
        >
          {isLoading && (
            <div className="w-3 h-3 border-t-transparent border-2 border-green-500 rounded-full animate-spin mr-2"></div>
          )}
          Initialize Device
        </button>
      </div>

      {status && (
        <div
          className={`text-center text-sm mt-2 ${
            status.includes("error") || status.includes("failed")
              ? "text-red-500"
              : status.includes("successful") ||
                status.includes("initialized successfully")
              ? "text-green-600"
              : "text-gray-600"
          }`}
        >
          {status}
        </div>
      )}

      {details && (
        <div className="mt-2 w-full">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-500 hover:text-blue-700"
          >
            {showDetails ? "Hide Details" : "Show Details"}
          </button>

          {showDetails && (
            <div className="mt-1 p-2 bg-gray-50 rounded-md text-xs font-mono border border-gray-200 max-h-32 overflow-auto">
              <pre>{JSON.stringify(details, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
