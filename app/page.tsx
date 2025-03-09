"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import PhoneContent from "../components/PhoneContent";
import CountryFlagRotator from "../components/CountryFlagRotator";

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
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
        <main className="max-w-7xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
          <div className="flex flex-col lg:flex-row items-center lg:items-start lg:space-x-12">
            {/* Left content area */}
            <div className="w-full lg:w-1/2 mb-12 lg:mb-0 text-center lg:text-left space-y-8">
              {/* Headline with more subtle animation */}
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                  <motion.div
                    initial={{ opacity: 1 }}
                    animate={{
                      opacity: showZkypee ? 0.3 : 1,
                      y: showZkypee ? -10 : 0,
                    }}
                    transition={{ duration: 0.7 }}
                  >
                    Skype is shutting down
                  </motion.div>

                  <AnimatePresence>
                    {showZkypee && (
                      <motion.div
                        className="text-blue-600 text-4xl sm:text-5xl md:text-6xl"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                      >
                        Zkypee is here
                      </motion.div>
                    )}
                  </AnimatePresence>
                </h1>
                <h2 className="text-xl sm:text-2xl font-medium text-blue-600">
                  The Professional Skype Alternative
                </h2>
                <p className="text-lg text-gray-700 max-w-xl">
                  Everything you loved about Skype but better - call any
                  landline or mobile phone worldwide with industry-leading
                  rates.
                </p>
              </div>

              {/* Features grid with icons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl">
                <div className="flex items-start space-x-3">
                  <div className="text-blue-500 mt-1">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Free Skype Replacement</p>
                    <p className="text-sm text-gray-600">
                      No compromises on quality
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="text-blue-500 mt-1">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Transfer Credits</p>
                    <p className="text-sm text-gray-600">
                      Keep your Skype balance
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="text-blue-500 mt-1">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Crystal Clear Calls</p>
                    <p className="text-sm text-gray-600">
                      HD quality worldwide
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="text-blue-500 mt-1">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">No Subscription</p>
                    <p className="text-sm text-gray-600">
                      Pay only for what you use
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing and country flag section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start sm:space-x-6 max-w-xl">
                {/* Pricing card */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-4 sm:mb-0">
                  <p className="text-sm text-blue-700 font-medium">From</p>
                  <p className="text-2xl font-bold text-blue-800">
                    $0.03
                    <span className="text-sm font-normal text-blue-600">
                      /minute
                    </span>
                  </p>
                  <p className="text-xs text-blue-600">
                    Up to 50% cheaper than Skype
                  </p>
                </div>

                {/* Country Flag Rotator - simplified */}
                <div className="flex items-center">
                  <CountryFlagRotator />
                </div>
              </div>

              {/* CTA Buttons - clearer hierarchy */}
              <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0 max-w-xl">
                <Link
                  href="/dial"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-center font-medium shadow-sm transition-colors flex items-center justify-center"
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
                  Start Calling Now
                </Link>
                <Link
                  href="/transfer"
                  className="text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-300 px-6 py-3 rounded-lg text-center font-medium transition-colors"
                >
                  Transfer Skype Credits
                </Link>
              </div>

              {/* Branding and contact - more professional */}
              <div className="text-sm text-gray-600 pt-4 border-t border-gray-100 max-w-xl space-y-2">
                <p>Developed by the Columbia University Communications Lab</p>
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span>Need help?</span>
                  <a
                    href="mailto:support@zkypee.com"
                    className="text-blue-600 hover:underline"
                  >
                    leonard.holter@columbia.edu
                  </a>
                </div>
              </div>
            </div>

            {/* Right side - Phone mockup */}
            <div className="w-full lg:w-1/2 flex justify-center">
              <div className="relative scale-90 sm:scale-100">
                {/* Phone frame - simplified */}
                <div className="relative z-10 bg-gradient-to-b from-gray-400 to-gray-300 rounded-[45px] p-[3px] shadow-lg">
                  {/* Inner frame */}
                  <div className="relative bg-black rounded-[42px] overflow-hidden w-[280px] sm:w-[320px] h-[560px] sm:h-[640px] border-[2px] border-gray-800">
                    {/* Dynamic Island - simplified */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[100px] h-[30px] bg-black rounded-b-3xl z-20 mt-2"></div>

                    {/* Status bar - simplified */}
                    <div className="h-12 w-full bg-black text-white flex items-center justify-between px-6 pt-4">
                      <div className="text-xs font-medium">9:41</div>
                      <div className="flex space-x-1.5">
                        <svg
                          className="w-3 h-3"
                          viewBox="0 0 24 24"
                          fill="white"
                        >
                          <path d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z" />
                        </svg>
                        <div className="w-4 relative">
                          <div className="absolute inset-y-0 left-0 w-3 h-2 mt-0.5 bg-white rounded-sm"></div>
                        </div>
                      </div>
                    </div>

                    {/* Phone content */}
                    <div className="bg-white h-full pt-12 pb-4 px-4">
                      <PhoneContent />
                    </div>

                    {/* Home indicator */}
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-white rounded-full"></div>
                  </div>
                </div>

                {/* Simplified decorative element */}
                <div className="absolute -bottom-5 -right-5 w-32 h-32 bg-blue-50 rounded-full opacity-40 blur-md"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </main>
  );
}
