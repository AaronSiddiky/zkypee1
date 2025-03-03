"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import Auth from "./Auth";
import { useTwilio } from "../contexts/TwilioContext";
import TwilioDebugPanel from "./TwilioDebugPanel";

interface PhoneDialerProps {
  user: any | null;
  loading: boolean;
}

export default function PhoneDialer({ user, loading }: PhoneDialerProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const {
    needsUserInteraction,
    initializeDevice,
    isConnecting,
    isConnected,
    isReady,
    error,
    makeCall,
    hangUp,
    testConnection,
  } = useTwilio();
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showPermissionMessage, setShowPermissionMessage] = useState(false);

  // Initialize Twilio device when user is available
  useEffect(() => {
    if (user && !isReady) {
      console.log("User is available, initializing device");
      // Initialize the device when the component loads
      const initDevice = async () => {
        try {
          await initializeDevice();
        } catch (err) {
          console.error("Error initializing device:", err);
        }
      };

      initDevice();
    }
  }, [user, isReady, initializeDevice]);

  // Add a more robust user interaction handler
  const ensureDeviceInitialized = async () => {
    if (user && needsUserInteraction) {
      console.log("Ensuring device is initialized via user interaction");
      try {
        await initializeDevice();
        return true;
      } catch (err) {
        console.error("Error initializing device:", err);
        return false;
      }
    }
    return true;
  };

  // Update the callDefaultNumber function to ensure device is initialized
  const callDefaultNumber = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    // Ensure device is initialized
    await ensureDeviceInitialized();

    // Make the call
    makeCallToNumber("+3324007734");
  };

  const handleUserInteraction = () => {
    if (user && needsUserInteraction) {
      initializeDevice();
    }
  };

  const handleNumberClick = (num: string) => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    // Initialize device on first user interaction
    handleUserInteraction();

    setPhoneNumber((prev) => prev + num);
  };

  const handleDelete = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    // Initialize device on first user interaction
    handleUserInteraction();

    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const handleCall = async () => {
    console.log("Call button clicked");

    // Check if user is authenticated
    if (!user) {
      console.log("User not authenticated, showing auth prompt");
      setStatusMessage("Please sign in to make calls");
      return;
    }

    // If no number is entered, use the default number
    if (!phoneNumber || phoneNumber.length < 10) {
      console.log("Using default number: +13324007734");
      makeCallToNumber("+13324007734");
      return;
    }

    // Format phone number if needed
    let formattedNumber = phoneNumber;
    if (!phoneNumber.startsWith("+")) {
      formattedNumber = `+1${phoneNumber.replace(/\D/g, "")}`;
      console.log(`Formatted phone number: ${formattedNumber}`);
    }

    makeCallToNumber(formattedNumber);
  };

  const makeCallToNumber = async (number: string) => {
    if (!user) {
      setShowAuth(true);
      setStatusMessage("Please sign in to make calls");
      return;
    }

    // Set status message
    setStatusMessage("Preparing call...");

    // Request microphone permissions
    try {
      console.log("Requesting microphone permissions");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop()); // Stop the stream after permission check
      console.log("Microphone permission granted");
    } catch (permissionError) {
      console.error("Microphone permission denied:", permissionError);
      setStatusMessage(
        "Microphone access is required. Please allow microphone access and try again."
      );
      setShowPermissionMessage(true);
      return;
    }

    // Ensure device is initialized
    if (!isReady) {
      setStatusMessage("Initializing device...");
      try {
        const initSuccess = await initializeDevice();
        if (!initSuccess) {
          setStatusMessage("Failed to initialize device. Please try again.");
          return;
        }
        // Wait a moment for the device to fully register
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (initError: any) {
        console.error("Error initializing device:", initError);
        setStatusMessage(
          `Initialization error: ${initError.message || "Unknown error"}`
        );
        return;
      }
    }

    // Set calling state
    setIsCalling(true);
    setStatusMessage("Connecting call...");

    try {
      // Make the call
      console.log("Initiating call to:", number);
      const callSuccess = await makeCall(number);

      if (callSuccess) {
        console.log("Call initiated successfully");
        setStatusMessage("Call connected");
      } else {
        console.log("Call failed to initiate");
        if (error) {
          setStatusMessage(error);
        } else {
          setStatusMessage("Failed to connect call. Please try again.");
        }
        setIsCalling(false);
      }
    } catch (callError: any) {
      console.error("Error making call:", callError);
      setStatusMessage(`Call error: ${callError.message || "Unknown error"}`);
      setIsCalling(false);
    }
  };

  const handleHangUp = () => {
    console.log("Hang up button clicked");
    hangUp();
    setIsCalling(false);
    setStatusMessage("Call ended");
  };

  const handleTestConnection = async () => {
    console.log("Testing Twilio connection");
    setStatusMessage("Testing connection...");

    try {
      const result = await testConnection();
      console.log("Connection test result:", result);

      if (result.success) {
        setStatusMessage(
          `Connection test successful. Device status: ${result.deviceStatus}`
        );
        // Force a UI update to reflect the new device state
        setTimeout(() => {
          if (result.isReady) {
            setStatusMessage("Device is ready for calls");
          }
        }, 1000);
      } else {
        setStatusMessage(
          `Connection test failed: ${result.error || "Unknown error"}`
        );

        // If there's a specific error about device initialization, provide more guidance
        if (result.error && result.error.includes("initialization failed")) {
          setTimeout(() => {
            setStatusMessage(
              "Please refresh the page and try again. If the problem persists, check your microphone permissions."
            );
          }, 3000);
        }
      }
    } catch (testError: any) {
      console.error("Error testing connection:", testError);
      setStatusMessage(
        `Connection test error: ${testError.message || "Unknown error"}`
      );
    }
  };

  // Update call status based on Twilio state
  useEffect(() => {
    if (error) {
      setCallStatus(`Error: ${error}`);
    } else if (isConnected) {
      setCallStatus("Call in progress");
    } else if (isConnecting) {
      setCallStatus("Connecting...");
    } else {
      setCallStatus(null);
    }
  }, [isConnecting, isConnected, error]);

  return (
    <>
      <div className="w-full h-full flex flex-col">
        {/* App header removed */}

        {/* Debug Panel - Only visible in development */}
        {process.env.NODE_ENV !== "production" && (
          <TwilioDebugPanel className="mb-4" />
        )}

        {/* Phone input */}
        <div
          className="bg-gray-50 rounded-3xl p-4 mb-6"
          onClick={handleUserInteraction}
        >
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => {
              if (!user) {
                setShowAuth(true);
                return;
              }

              // Initialize device on first user interaction
              handleUserInteraction();

              setPhoneNumber(e.target.value);
            }}
            className="w-full text-2xl font-medium text-center py-2 bg-transparent border-b border-gray-200 mb-2 focus:outline-none"
            placeholder="Enter phone number"
            readOnly={!user}
          />

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">Credit: Free</div>
            <div className="flex space-x-2">
              <div
                className={`h-3 w-12 rounded-full ${
                  phoneNumber ? "bg-blue-500" : "bg-gray-300"
                }`}
              ></div>
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
            </div>
          </div>
        </div>

        {/* Call status message */}
        {statusMessage && (
          <div className="text-center text-sm text-gray-600 mt-2 mb-2">
            {statusMessage}
          </div>
        )}

        {/* Microphone permission message */}
        {showPermissionMessage && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Microphone access required
                </h3>
                <div className="mt-1 text-sm text-yellow-700">
                  <p>
                    Please allow microphone access in your browser to make
                    calls.
                  </p>
                </div>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setShowPermissionMessage(false)}
                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, "+", 0, "#"].map((num, index) => (
            <motion.button
              key={index}
              onClick={() => handleNumberClick(num.toString())}
              className="h-14 w-14 rounded-full flex flex-col items-center justify-center mx-auto bg-gray-50 hover:bg-gray-100"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-xl font-medium">{num}</span>
              {num === 2 && (
                <span className="text-[10px] text-gray-500">ABC</span>
              )}
              {num === 3 && (
                <span className="text-[10px] text-gray-500">DEF</span>
              )}
              {num === 4 && (
                <span className="text-[10px] text-gray-500">GHI</span>
              )}
              {num === 5 && (
                <span className="text-[10px] text-gray-500">JKL</span>
              )}
              {num === 6 && (
                <span className="text-[10px] text-gray-500">MNO</span>
              )}
              {num === 7 && (
                <span className="text-[10px] text-gray-500">PQRS</span>
              )}
              {num === 8 && (
                <span className="text-[10px] text-gray-500">TUV</span>
              )}
              {num === 9 && (
                <span className="text-[10px] text-gray-500">WXYZ</span>
              )}
            </motion.button>
          ))}
        </div>

        {/* Call controls */}
        <div className="flex justify-between items-center mt-auto">
          <motion.button
            className="p-3 rounded-full bg-gray-100"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (!user) {
                setShowAuth(true);
                return;
              }
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
          </motion.button>

          <motion.button
            onClick={handleCall}
            className={`h-14 w-14 rounded-full flex items-center justify-center transition-colors ${
              isCalling
                ? "bg-red-500 hover:bg-red-600"
                : phoneNumber.trim() === ""
                ? "bg-blue-300 cursor-not-allowed" // Disabled appearance when no number
                : !isReady && user !== null
                ? "bg-yellow-500 hover:bg-yellow-600" // Yellow when device not ready
                : "bg-blue-500 hover:bg-blue-600 animate-pulse" // Add pulse animation to make it more obvious
            }`}
            whileHover={{ scale: phoneNumber.trim() === "" ? 1 : 1.05 }}
            whileTap={{ scale: phoneNumber.trim() === "" ? 1 : 0.95 }}
            disabled={phoneNumber.trim() === ""}
          >
            {isCalling ? (
              // Show loading spinner when connecting
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            )}
          </motion.button>

          <motion.button
            onClick={handleDelete}
            className="p-3 rounded-full bg-gray-100"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
              />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuth && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowAuth(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 z-10"
                onClick={() => setShowAuth(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
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
              </button>
              <Auth
                onSuccess={() => {
                  setShowAuth(false);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
