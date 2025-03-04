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
    device,
    isReady,
    isConnecting,
    isConnected,
    error,
    connection,
    setupDevice,
    makeCall,
    hangUp,
  } = useTwilio();

  const [callDuration, setCallDuration] = useState(0);
  const [durationInterval, setDurationInterval] = useState<number | undefined>(
    undefined
  );
  const [twilioNumber, setTwilioNumber] = useState<string | null>(null);

  // Add keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if not in a text input and not showing AI assistant
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = event.key;

      // Handle numeric keys (both numpad and regular numbers)
      if (
        /^[0-9*#]$/.test(key) ||
        (event.code === "NumpadEnter" && key === "Enter")
      ) {
        event.preventDefault();
        handleNumberClick(key === "Enter" ? "#" : key);
      }
      // Handle backspace/delete
      else if (key === "Backspace" || key === "Delete") {
        event.preventDefault();
        handleDelete();
      }
      // Handle Enter key for making calls
      else if (key === "Enter" && !event.code.includes("Numpad")) {
        event.preventDefault();
        handleCall();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []); // Add dependencies

  // Initialize Twilio device when user is available
  useEffect(() => {
    if (user && !device) {
      console.log("User available, setting up device");
      setupDevice();
      fetchTwilioNumber();
    }
  }, [user, device, setupDevice]);

  // Fetch the Twilio phone number
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
      console.error("Error fetching Twilio phone number:", error);
    }
  };

  // Set up call duration timer when connected
  useEffect(() => {
    if (isConnected && connection) {
      console.log("Call connected, starting duration timer");
      const interval = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      setDurationInterval(interval);

      return () => {
        if (interval) {
          window.clearInterval(interval);
        }
      };
    } else if (!isConnected) {
      console.log("Call disconnected, resetting duration");
      if (durationInterval) {
        window.clearInterval(durationInterval);
      }
      setDurationInterval(undefined);
      setCallDuration(0);
    }
  }, [isConnected, connection]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (durationInterval) {
        window.clearInterval(durationInterval);
      }
    };
  }, [durationInterval]);

  const handleNumberClick = (num: string) => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setPhoneNumber((prev) => prev + num);
  };

  const handleDelete = () => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const handleCall = async () => {
    if (!phoneNumber.trim()) {
      alert("Please enter a phone number");
      return;
    }

    if (!user) {
      setShowAuth(true);
      return;
    }

    console.log("Making call to:", phoneNumber);
    await makeCall(phoneNumber);
  };

  const handleHangUp = () => {
    console.log("Hanging up call");
    hangUp();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <>
      <div className="w-full h-full flex flex-col">
        {/* Debug Panel - Only visible in development */}
        {process.env.NODE_ENV !== "production" && (
          <TwilioDebugPanel className="mb-4" />
        )}

        {/* Phone input */}
        <div className="bg-gray-50 rounded-3xl p-4 mb-6">
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
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

        {/* Error message */}
        {error && (
          <div className="text-center text-sm text-red-600 mt-2 mb-4 p-2 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        {/* Dialer pad */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, "*", 0, "#"].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              className="w-full h-14 bg-white rounded-full flex items-center justify-center text-xl font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {num}
            </button>
          ))}
        </div>

        <div className="flex justify-center mb-6">
          {!isConnected && !isConnecting ? (
            <button
              onClick={handleCall}
              disabled={!phoneNumber.trim() || !user || !isReady}
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                phoneNumber.trim() && user && isReady
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-gray-300"
              } transition-colors`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
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
            </button>
          ) : (
            <button
              onClick={handleHangUp}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
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
          )}
        </div>

        {/* Call status */}
        {(isConnecting || isConnected) && (
          <div className="text-center mb-6">
            <div className="flex flex-col items-center space-y-2">
              <span className="text-lg font-medium text-gray-700">
                {isConnecting
                  ? "Connecting..."
                  : isConnected
                  ? "Connected"
                  : "Call ended"}
              </span>
              {isConnected && (
                <span className="text-gray-600">
                  {formatDuration(callDuration)}
                </span>
              )}
            </div>

            <button
              onClick={handleHangUp}
              className="w-full py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 font-medium mt-4"
            >
              End Call
            </button>
          </div>
        )}
      </div>

      {/* Authentication modal */}
      <AnimatePresence>
        {showAuth && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
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
              <Auth onSuccess={() => setShowAuth(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 text-center text-sm text-gray-500">
        {user ? (
          <p>Calling as {user.email}</p>
        ) : (
          <p>Please sign in to make calls</p>
        )}
      </div>
    </>
  );
}
