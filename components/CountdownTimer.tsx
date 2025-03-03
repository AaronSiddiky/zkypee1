"use client";

import React, { useState, useEffect } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Helper function to pad numbers with leading zeros
const padWithZero = (num: number): string => {
  return num.toString().padStart(2, "0");
};

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Set the release date to March 5, 2025
    const releaseDate = new Date("March 5, 2025 00:00:00").getTime();

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = releaseDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor(
            (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          ),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    // Clear interval on component unmount
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center">
        <div className="flex space-x-1 sm:space-x-2 text-center">
          <div className="flex flex-col items-center">
            <div className="bg-blue-100 rounded-lg w-12 sm:w-16 h-14 sm:h-16 flex items-center justify-center shadow-sm">
              <span className="text-lg sm:text-2xl font-bold text-blue-600">
                {padWithZero(timeLeft.days)}
              </span>
            </div>
            <span className="text-xs sm:text-sm mt-1 text-gray-600">Days</span>
          </div>

          <div className="flex items-center justify-center h-14 sm:h-16 px-1">
            <span className="text-lg sm:text-2xl font-bold text-blue-400">
              :
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-blue-100 rounded-lg w-12 sm:w-16 h-14 sm:h-16 flex items-center justify-center shadow-sm">
              <span className="text-lg sm:text-2xl font-bold text-blue-600">
                {padWithZero(timeLeft.hours)}
              </span>
            </div>
            <span className="text-xs sm:text-sm mt-1 text-gray-600">Hours</span>
          </div>

          <div className="flex items-center justify-center h-14 sm:h-16 px-1">
            <span className="text-lg sm:text-2xl font-bold text-blue-400">
              :
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-blue-100 rounded-lg w-12 sm:w-16 h-14 sm:h-16 flex items-center justify-center shadow-sm">
              <span className="text-lg sm:text-2xl font-bold text-blue-600">
                {padWithZero(timeLeft.minutes)}
              </span>
            </div>
            <span className="text-xs sm:text-sm mt-1 text-gray-600">Mins</span>
          </div>

          <div className="flex items-center justify-center h-14 sm:h-16 px-1">
            <span className="text-lg sm:text-2xl font-bold text-blue-400">
              :
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-blue-100 rounded-lg w-12 sm:w-16 h-14 sm:h-16 flex items-center justify-center shadow-sm">
              <span className="text-lg sm:text-2xl font-bold text-blue-600">
                {padWithZero(timeLeft.seconds)}
              </span>
            </div>
            <span className="text-xs sm:text-sm mt-1 text-gray-600">Secs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
