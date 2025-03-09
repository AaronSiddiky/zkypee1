"use client";

import React, { useState } from "react";

export default function PhoneContent() {
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleKeyPress = (key: string) => {
    if (key === "delete") {
      setPhoneNumber((prev) => prev.slice(0, -1));
    } else {
      setPhoneNumber((prev) => prev + key);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Phone number display */}
      <div className="text-center pt-2 sm:pt-4 pb-1 sm:pb-2 px-1 sm:px-4">
        <div className="text-xl sm:text-2xl md:text-3xl font-medium mb-1 truncate">
          {phoneNumber || "Enter a number"}
        </div>
        <div className="text-xs text-blue-600 font-medium">
          Professional calling service
        </div>
      </div>

      {/* Dial pad */}
      <div className="flex-1 px-1 sm:px-4 mt-1 sm:mt-2">
        <div className="grid grid-cols-3 gap-1 sm:gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, "*", 0, "#"].map((key) => (
            <button
              key={key}
              className="w-full aspect-square rounded-lg bg-gray-50 flex items-center justify-center text-base sm:text-lg md:text-xl font-medium hover:bg-gray-100 transition-colors"
              onClick={() => handleKeyPress(key.toString())}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* Call button */}
      <div className="pb-2 sm:pb-4 md:pb-6 pt-1 sm:pt-2 md:pt-4 flex justify-center">
        <button
          className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600 transition-colors shadow-sm"
          disabled={!phoneNumber}
        >
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white"
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
      </div>
    </div>
  );
}
