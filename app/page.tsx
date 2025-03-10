"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import PhoneContent from "../components/PhoneContent";
import CountryFlagRotator from "../components/CountryFlagRotator";

// Sticky mobile CTA component
const MobileStickyButton = () => (
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 md:hidden z-50">
    <Link
      href="/dial"
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-center font-medium shadow-sm transition-colors flex items-center justify-center w-full"
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
      Start Saving Now — $0.03/min
    </Link>
  </div>
);

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
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 pb-16 md:pb-0">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16">
          <div className="flex flex-col lg:flex-row items-center justify-center lg:items-start lg:space-x-12">
            {/* Left content area */}
            <div className="w-full lg:w-1/2 mb-8 sm:mb-12 lg:mb-0 text-center sm:text-center lg:text-left space-y-6 sm:space-y-8 mx-auto">
              {/* Headline with more direct value proposition */}
              <div className="space-y-2 sm:space-y-4">
                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium inline-block mb-2">
                  Skype Alternative
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
                  <span className="text-blue-600">Zkypee</span> - Call Anyone,
                  Anywhere
                </h1>
                <h2 className="text-lg sm:text-xl font-medium text-gray-700">
                  Save up to 50% on international calls
                </h2>
                <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto lg:mx-0">
                  Everything you loved about Skype but better - with
                  industry-leading rates starting at just $0.03/minute.
                </p>

                {/* Quick value badges */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-2">
                  <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium inline-flex items-center">
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    No Subscription
                  </span>
                  <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium inline-flex items-center">
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    HD Quality
                  </span>
                  <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium inline-flex items-center">
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Keep Skype Credits
                  </span>
                </div>

                {/* Mobile app image - only visible on mobile */}
                <div className="w-full max-w-xl mx-auto lg:hidden mt-6 mb-8">
                  <h3 className="text-center text-lg font-medium text-blue-600 mb-3">
                    See it in action
                  </h3>
                  <div className="bg-gradient-to-r from-blue-50 to-white p-3 rounded-lg shadow-sm">
                    <div className="rounded-lg overflow-hidden shadow-md relative border border-blue-100">
                      <Image
                        src="/images/home.png"
                        alt="Zkypee mobile app"
                        width={600}
                        height={400}
                        className="w-full h-auto"
                        priority
                      />
                    </div>
                    <p className="text-center text-sm text-gray-600 mt-3 font-medium">
                      Simple, intuitive interface for crystal-clear calls
                    </p>
                  </div>
                </div>

                {/* Columbia University Backing - Desktop */}
                <div className="hidden lg:flex items-center justify-start mt-6 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <Image
                    src="/images/cc.png"
                    alt="Columbia University Logo"
                    width={40}
                    height={40}
                    className="mr-3"
                  />
                  <p className="text-sm text-gray-700">
                    Backed by{" "}
                    <span className="font-semibold">Columbia University</span>
                  </p>
                </div>
              </div>

              {/* Enhanced pricing section */}
              <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-4 w-full max-w-xl mx-auto lg:mx-0 my-6">
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center mb-2">
                    <span className="text-3xl font-bold text-blue-600">
                      $0.03
                    </span>
                    <span className="text-gray-600 ml-1">/minute</span>
                  </div>

                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
                    Save up to 50% vs Skype
                  </div>

                  <div className="flex items-center justify-center space-x-4 w-full mt-2">
                    <div className="flex flex-col items-center">
                      <div className="text-sm font-medium text-gray-500">
                        Zkypee
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        $0.03
                      </div>
                    </div>

                    <div className="h-8 border-r border-gray-200"></div>

                    <div className="flex flex-col items-center">
                      <div className="text-sm font-medium text-gray-500">
                        Skype
                      </div>
                      <div className="text-lg font-bold text-gray-600 line-through">
                        $0.06
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 w-full">
                    <Link
                      href="/dial"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-center font-medium shadow-sm transition-colors flex items-center justify-center w-full"
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
                      Start Saving Now
                    </Link>
                  </div>
                </div>
              </div>

              {/* Secondary CTA */}
              <div className="mb-6">
                <Link
                  href="/transfer"
                  className="border border-blue-200 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg text-center font-medium transition-colors flex items-center justify-center w-full"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8z" />
                    <path d="M12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                  </svg>
                  Transfer Skype Credits & Get 10% Bonus
                </Link>
              </div>
            </div>

            {/* Right side - Phone mockup (hidden on mobile) */}
            <div className="w-full lg:w-1/2 hidden md:flex justify-center mt-6 lg:mt-0">
              <div className="relative scale-75 sm:scale-90 md:scale-100">
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

                {/* Simplified decorative element - hidden on very small screens */}
                <div className="absolute -bottom-5 -right-5 w-32 h-32 bg-blue-50 rounded-full opacity-40 blur-md hidden xs:block"></div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Columbia University Backing - Mobile */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4 flex items-center justify-center z-40 shadow-md">
        <Image
          src="/images/cc.png"
          alt="Columbia University Logo"
          width={36}
          height={36}
          className="mr-3"
        />
        <p className="text-sm font-medium text-gray-700">
          Backed by{" "}
          <span className="font-semibold text-blue-700">
            Columbia University
          </span>
        </p>
      </div>

      {/* Sticky mobile CTA */}
      <MobileStickyButton />
    </main>
  );
}
