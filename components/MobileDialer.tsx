"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function MobileDialer() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callButtonEnabled, setCallButtonEnabled] = useState(false);

  // Enable call button when phone number is entered
  useEffect(() => {
    setCallButtonEnabled(phoneNumber.length > 5);
  }, [phoneNumber]);

  const handleKeyPress = (key: string) => {
    if (key === "delete") {
      setPhoneNumber((prev) => prev.slice(0, -1));
    } else {
      setPhoneNumber((prev) => prev + key);
    }
  };

  // Format phone number for display
  const formatPhoneNumber = (number: string) => {
    if (!number) return "";

    // Simple formatting for international numbers
    if (number.length > 0) {
      let formatted = "+" + number;
      return formatted;
    }

    return number;
  };

  return (
    <div className="flex flex-col">
      {/* Phone number display */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3 text-center">
        <div className="text-xl font-medium truncate min-h-[32px]">
          {phoneNumber ? "+" + phoneNumber : "Enter a number"}
        </div>
      </div>

      {/* Dial pad */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, "*", 0, "#"].map((key) => (
          <button
            key={key}
            className="aspect-square rounded-lg bg-white border border-gray-200 flex items-center justify-center text-xl font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
            onClick={() => handleKeyPress(key.toString())}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Delete button */}
      <div className="flex justify-center mb-3">
        <button
          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium disabled:opacity-50"
          onClick={() => handleKeyPress("delete")}
          disabled={!phoneNumber}
        >
          Delete
        </button>
      </div>

      {/* Call button */}
      <div className="flex justify-center">
        <Link
          href={callButtonEnabled ? `/dial?number=${phoneNumber}` : "#"}
          className={`w-full py-3 rounded-lg flex items-center justify-center shadow-sm transition-colors ${
            callButtonEnabled
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
          onClick={(e) => {
            if (!callButtonEnabled) {
              e.preventDefault();
            }
          }}
        >
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
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
          {callButtonEnabled ? "Call Now" : "Enter a number"}
        </Link>
      </div>

      {/* First call free badge */}
      {callButtonEnabled && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-center"
        >
          <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium inline-block">
            First call is free!
          </span>
        </motion.div>
      )}
    </div>
  );
}
