"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import PhoneContent from "../components/PhoneContent";
import CountdownTimer from "../components/CountdownTimer";

export default function HomePage() {
  const [showZkypee, setShowZkypee] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowZkypee(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main>
      <div className="min-h-screen">
        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-12 flex flex-col lg:flex-row items-center">
          <div className="w-full lg:w-1/2 mb-8 lg:mb-0 text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              <motion.div
                initial={{ opacity: 1 }}
                animate={{
                  opacity: showZkypee ? 0.5 : 1,
                  textDecoration: showZkypee ? "line-through" : "none",
                }}
                transition={{ duration: 0.5 }}
              >
                Skype is gone
              </motion.div>

              <AnimatePresence>
                {showZkypee && (
                  <motion.div
                    className="text-blue-500 text-4xl sm:text-5xl md:text-6xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    Zkypee is here
                  </motion.div>
                )}
              </AnimatePresence>
            </h1>
            <p className="text-lg sm:text-xl mb-6 sm:mb-8">
              Transfer your Skype Credits and enjoy cheaper rates today
            </p>

            {/* Countdown Timer */}
            <AnimatePresence>
              {showZkypee && (
                <motion.div
                  className="mb-6 w-full flex justify-center lg:justify-start"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <CountdownTimer />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center lg:justify-start">
              <Link
                href="/signup"
                className="bg-blue-500 text-white px-8 py-3 rounded-full text-center"
              >
                Call anyone anywhere!
              </Link>
              <Link
                href="/transfer"
                className="text-blue-500 px-8 py-3 flex items-center justify-center"
              >
                Convert your skype credits →
              </Link>
            </div>
            <p className="text-sm text-gray-700 font-medium mt-4">
              Made by Fellow betrayed Skype Users at Columbia University
            </p>
          </div>

          <div className="w-full lg:w-1/2 flex justify-center">
            <div className="relative scale-90 sm:scale-100">
              {/* Phone frame - iPhone 16 style with titanium edges */}
              <div className="relative z-10 bg-gradient-to-b from-gray-400 to-gray-300 rounded-[55px] p-[3px] shadow-2xl">
                {/* Titanium frame effect */}
                <div className="absolute inset-0 rounded-[55px] bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 opacity-80"></div>

                {/* Inner frame */}
                <div className="relative bg-black rounded-[52px] overflow-hidden w-[280px] sm:w-[340px] h-[560px] sm:h-[680px] border-[3px] border-gray-800">
                  {/* Dynamic Island */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[110px] sm:w-[130px] h-[30px] sm:h-[35px] bg-black rounded-b-3xl z-20 mt-2 flex items-center justify-center">
                    {/* Front camera */}
                    <div className="absolute right-6 w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-gray-800 ring-1 ring-gray-700 flex items-center justify-center">
                      <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-gray-600"></div>
                    </div>

                    {/* Face ID sensors */}
                    <div className="absolute left-6 w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-gray-800"></div>
                  </div>

                  {/* Status bar */}
                  <div className="h-12 sm:h-14 w-full bg-black text-white flex items-center justify-between px-6 sm:px-8 pt-4 sm:pt-6">
                    <div className="text-xs font-medium">9:41</div>
                    <div className="flex space-x-1.5">
                      <svg
                        className="w-3 sm:w-4 h-3 sm:h-4"
                        viewBox="0 0 24 24"
                        fill="white"
                      >
                        <path d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z" />
                      </svg>
                      <svg
                        className="w-3 sm:w-4 h-3 sm:h-4"
                        viewBox="0 0 24 24"
                        fill="white"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                      </svg>
                      <div className="w-4 sm:w-6 relative">
                        <div className="absolute inset-y-0 left-0 w-3 sm:w-5 h-2 sm:h-3 mt-0.5 bg-white rounded-sm"></div>
                        <div className="absolute inset-y-0 right-0 w-0.5 sm:w-1 h-2 sm:h-3 mt-0.5 bg-white rounded-sm ml-0.5"></div>
                      </div>
                    </div>
                  </div>

                  {/* Phone content */}
                  <div className="bg-white h-full pt-12 sm:pt-14 pb-4 px-4">
                    <PhoneContent />
                  </div>

                  {/* Home indicator */}
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-24 sm:w-32 h-1 bg-white rounded-full"></div>
                </div>
              </div>

              {/* Camera bump */}
              <div className="absolute top-20 sm:top-24 -right-2 sm:-right-3 w-12 sm:w-16 h-24 sm:h-32 bg-gradient-to-b from-gray-400 to-gray-300 rounded-2xl z-0"></div>
              <div className="absolute top-24 sm:top-28 -right-1 sm:-right-2 w-8 sm:w-12 h-16 sm:h-24 bg-gray-800 rounded-xl z-1 flex flex-col items-center justify-center space-y-2 sm:space-y-3 p-1">
                <div className="w-6 sm:w-9 h-6 sm:h-9 rounded-full bg-gray-700 ring-1 ring-gray-600 flex items-center justify-center">
                  <div className="w-4 sm:w-6 h-4 sm:h-6 rounded-full bg-gray-800 ring-1 ring-gray-700"></div>
                </div>
                <div className="w-6 sm:w-9 h-6 sm:h-9 rounded-full bg-gray-700 ring-1 ring-gray-600 flex items-center justify-center">
                  <div className="w-4 sm:w-6 h-4 sm:h-6 rounded-full bg-gray-800 ring-1 ring-gray-700"></div>
                </div>
                <div className="w-6 sm:w-9 h-6 sm:h-9 rounded-full bg-gray-700 ring-1 ring-gray-600 flex items-center justify-center">
                  <div className="w-4 sm:w-6 h-4 sm:h-6 rounded-full bg-gray-800 ring-1 ring-gray-700"></div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -bottom-10 -right-10 w-48 sm:w-64 h-48 sm:h-64 bg-blue-100 rounded-full opacity-50 blur-xl"></div>
              <div className="absolute -top-10 -left-10 w-32 sm:w-48 h-32 sm:h-48 bg-blue-100 rounded-full opacity-50 blur-xl"></div>

              {/* Volume buttons */}
              <div className="absolute top-32 -left-1 w-1 h-6 sm:h-8 bg-gray-400 rounded-l-lg"></div>
              <div className="absolute top-44 -left-1 w-1 h-6 sm:h-8 bg-gray-400 rounded-l-lg"></div>

              {/* Power button */}
              <div className="absolute top-32 -right-3 sm:-right-4 w-1 h-10 sm:h-12 bg-gray-400 rounded-r-lg"></div>
            </div>
          </div>
        </main>
      </div>
    </main>
  );
}
