"use client";

import React, { useState, useEffect } from "react";
import { useTwilio } from "../../contexts/TwilioContext";

export default function TestTwilioPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [testResults, setTestResults] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);

  // Use this to ensure we're only rendering on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Safely get the Twilio context
  let twilioContext;
  try {
    twilioContext = useTwilio();
  } catch (error: any) {
    console.error("Error accessing Twilio context:", error);
    if (isClient) {
      setContextError(error.message || "Failed to access Twilio context");
    }
  }

  const {
    initializeDevice,
    makeCall,
    hangUp,
    testConnection,
    isReady,
    isConnecting,
    isConnected,
    error,
    deviceDebugInfo,
  } = twilioContext || {
    initializeDevice: async () => false,
    makeCall: async () => false,
    hangUp: () => {},
    testConnection: async () => ({
      success: false,
      error: "Twilio context not available",
    }),
    isReady: false,
    isConnecting: false,
    isConnected: false,
    error: null,
    deviceDebugInfo: {
      lastAction: "none",
      timestamp: 0,
      deviceState: null,
      error: null,
    },
  };

  const handleInitialize = async () => {
    const success = await initializeDevice();
    console.log("Device initialization result:", success);
  };

  const handleTest = async () => {
    const results = await testConnection();
    setTestResults(results);
    console.log("Test results:", results);
  };

  const handleCall = async () => {
    if (!phoneNumber) {
      alert("Please enter a phone number");
      return;
    }
    const success = await makeCall(phoneNumber);
    console.log("Call result:", success);
  };

  const handleHangUp = () => {
    hangUp();
  };

  // Only render the component on the client
  if (!isClient) {
    return <div>Loading...</div>;
  }

  // Show error if context is not available
  if (contextError) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Twilio Test Page</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>
            <strong>Error:</strong> {contextError}
          </p>
          <p>
            Please make sure the TwilioProvider is properly set up in your
            application.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Twilio Test Page</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Device Status</h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-100 p-2 rounded">
            <span className="font-medium">Ready:</span> {isReady ? "✅" : "❌"}
          </div>
          <div className="bg-gray-100 p-2 rounded">
            <span className="font-medium">Connecting:</span>{" "}
            {isConnecting ? "✅" : "❌"}
          </div>
          <div className="bg-gray-100 p-2 rounded">
            <span className="font-medium">Connected:</span>{" "}
            {isConnected ? "✅" : "❌"}
          </div>
          <div className="bg-gray-100 p-2 rounded">
            <span className="font-medium">Last Action:</span>{" "}
            {deviceDebugInfo.lastAction}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Device Controls</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleInitialize}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Initialize Device
          </button>

          <button
            onClick={handleTest}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Test Connection
          </button>
        </div>
      </div>

      {testResults && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Test Results</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Make a Call</h2>
        <div className="flex flex-col gap-2">
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter phone number (e.g., +1234567890)"
            className="border border-gray-300 p-2 rounded"
          />

          <div className="flex gap-2">
            <button
              onClick={handleCall}
              disabled={isConnected || isConnecting}
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${
                isConnected || isConnecting
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {isConnecting ? "Connecting..." : "Call"}
            </button>

            <button
              onClick={handleHangUp}
              disabled={!isConnected}
              className={`bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ${
                !isConnected ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Hang Up
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Debug Info</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
          {JSON.stringify(deviceDebugInfo, null, 2)}
        </pre>
      </div>
    </div>
  );
}
