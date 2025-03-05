"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import Auth from "./Auth";
import { useTwilio } from "../contexts/TwilioContext";
import TwilioDebugPanel from "./TwilioDebugPanel";
import CreditBalance from "./CreditBalance";
import Link from "next/link";
import CallInfo from "./CallInfo";
import LowCreditWarning from "./LowCreditWarning";

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
    callDuration,
    estimatedCost,
    insufficientCredits,
    isMuted,
    toggleMute,
  } = useTwilio();

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

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Make a Call</h2>
        <p className="text-gray-600">Enter a phone number to call</p>
      </div>

      {/* Credit balance display */}
      {user && (
        <div className="mb-4 flex justify-between items-center">
          <CreditBalance showBuyButton={true} />
          <Link
            href="/credits/history"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View History
          </Link>
        </div>
      )}

      {/* Low credit warning */}
      {user && <LowCreditWarning threshold={15} />}

      {/* Call information during active call */}
      <CallInfo />

      {/* Phone number input */}
      <div className="relative mb-4">
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Enter phone number"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {phoneNumber && (
          <button
            onClick={handleDelete}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M6.707 4.879A3 3 0 018.828 4H15a3 3 0 013 3v6a3 3 0 01-3 3H8.828a3 3 0 01-2.12-.879l-4.415-4.414a1 1 0 010-1.414l4.414-4.414zm4.586 1.707a1 1 0 00-1.414 1.414L11.586 10l-1.707 1.707a1 1 0 101.414 1.414L13 11.414l1.707 1.707a1 1 0 001.414-1.414L14.414 10l1.707-1.707a1 1 0 00-1.414-1.414L13 8.586l-1.707-1.707z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
          {insufficientCredits && (
            <div className="mt-2">
              <Link
                href="/credits"
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
              >
                Add Credits
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Dialer buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, "*", 0, "#"].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(num.toString())}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 rounded-md transition-colors"
            disabled={isConnected}
          >
            {num}
          </button>
        ))}
      </div>

      {/* Call/Hangup button */}
      <div className="flex justify-center">
        {!isConnected ? (
          <button
            onClick={handleCall}
            disabled={isConnecting || !isReady}
            className={`flex items-center justify-center w-16 h-16 rounded-full ${
              isConnecting
                ? "bg-yellow-500"
                : isReady
                ? "bg-green-500 hover:bg-green-600"
                : "bg-gray-300"
            } text-white transition-colors`}
          >
            {isConnecting ? (
              <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
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
          </button>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            {/* Call controls - mute button and hang up button */}
            <div className="flex items-center space-x-4">
              {/* Mute button */}
              <button
                onClick={toggleMute}
                className={`flex items-center justify-center w-12 h-12 rounded-full ${
                  isMuted
                    ? "bg-gray-700 hover:bg-gray-800"
                    : "bg-gray-500 hover:bg-gray-600"
                } text-white transition-colors`}
                title={isMuted ? "Unmute call" : "Mute call"}
              >
                {isMuted ? (
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
                      d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                    />
                  </svg>
                ) : (
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
                      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                  </svg>
                )}
              </button>

              {/* Hang up button */}
              <button
                onClick={handleHangUp}
                className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                title="End call"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
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
            </div>

            {/* Mute status text */}
            <span className="text-sm text-gray-600">
              {isMuted ? "Muted" : "Unmute"}
            </span>
          </div>
        )}
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
              <Auth onSuccess={() => setShowAuth(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
