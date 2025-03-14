"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function PurchaseLocalNumberPage() {
  const [timeLeft, setTimeLeft] = useState({
    days: 3,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Set the release date to 3 days from now
    const releaseDate = new Date();
    releaseDate.setDate(releaseDate.getDate() + 3);

    const timer = setInterval(() => {
      const now = new Date();
      const difference = releaseDate.getTime() - now.getTime();

      if (difference <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="p-8 sm:p-12">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Purchase Local Number
              </h1>
              <div className="flex items-center justify-center">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold bg-yellow-100 text-yellow-800">
                  Coming Soon (From $1 per month)
                </span>
              </div>
              <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
                We're excited to announce that world wide local number
                purchasing will be available in:
              </p>
            </div>

            <div className="flex justify-center space-x-4 sm:space-x-8 mb-12">
              <div className="flex flex-col items-center">
                <div className="text-5xl font-bold text-blue-600 bg-blue-50 w-20 h-20 rounded-lg flex items-center justify-center">
                  {timeLeft.days}
                </div>
                <span className="mt-2 text-gray-600">Days</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-5xl font-bold text-blue-600 bg-blue-50 w-20 h-20 rounded-lg flex items-center justify-center">
                  {timeLeft.hours}
                </div>
                <span className="mt-2 text-gray-600">Hours</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-5xl font-bold text-blue-600 bg-blue-50 w-20 h-20 rounded-lg flex items-center justify-center">
                  {timeLeft.minutes}
                </div>
                <span className="mt-2 text-gray-600">Minutes</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-5xl font-bold text-blue-600 bg-blue-50 w-20 h-20 rounded-lg flex items-center justify-center">
                  {timeLeft.seconds}
                </div>
                <span className="mt-2 text-gray-600">Seconds</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-600 mb-6">
                Get ready to purchase your own local phone numbers directly
                through our platform. This feature will allow you to have a
                local presence in different regions.
              </p>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Benefits of Local Numbers:
                </h3>
                <ul className="text-left text-gray-600 space-y-2 max-w-lg mx-auto">
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Establish local presence in different markets
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Improve answer rates with recognizable area codes
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Build trust with customers in specific regions
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
