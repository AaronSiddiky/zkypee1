"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import CountryFlagRotator from "../components/CountryFlagRotator";
import MobileDialer from "../components/MobileDialer";
import PhoneContent from "../components/PhoneContent";

// Sticky header component - only visible on mobile
const StickyHeader = () => (
  <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 p-3 flex justify-between items-center z-50 md:hidden">
    <div className="flex items-center">
      <span className="text-blue-600 font-bold text-xl">Zkypee</span>
    </div>
    <Link
      href="/dial"
      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center"
    >
      <svg
        className="w-4 h-4 mr-1"
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
      Call Now
    </Link>
  </div>
);

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
      Try calling for free now
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
      {/* Mobile Design - Only visible on small screens */}
      <div className="md:hidden pt-16">
        <StickyHeader />
        <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
          <main className="max-w-7xl mx-auto px-4 py-4">
            {/* Hero Section - Simplified and focused */}
            <div className="text-center mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold">
                <span className="text-blue-600">Call Anyone, Anywhere</span> for
                Just $0.03/min
              </h1>

              {/* Columbia University Badge - Moved up for trust */}
              <div className="flex items-center justify-center mt-2 mb-3">
                <Image
                  src="/images/cc.png"
                  alt="Columbia University Logo"
                  width={32}
                  height={32}
                  className="mr-2"
                />
                <p className="text-sm font-medium text-gray-700">
                  Backed by{" "}
                  <span className="font-semibold text-blue-700">
                    Columbia University
                  </span>
                </p>
              </div>

              {/* Direct price comparison */}
              <div className="bg-green-50 text-green-800 px-3 py-2 rounded-lg text-sm font-medium inline-block mb-3">
                Save 50% vs Skype ($0.06/min)
              </div>
            </div>

            {/* Interactive Dialer - Main focus of the page */}
            <div className="bg-white rounded-xl shadow-md border border-blue-100 p-4 mb-6">
              <div className="text-center mb-3">
                <div className="text-lg font-bold text-blue-600">
                  Try Your First Call Free
                </div>
                <p className="text-sm text-gray-600">
                  No signup required. Call instantly.
                </p>
              </div>

              {/* Embedded Dialer Component */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <MobileDialer />
              </div>
            </div>

            {/* Trust Elements */}
            <div className="mb-6">
              <div className="flex justify-center space-x-4 mb-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">10k+</div>
                  <div className="text-xs text-gray-600">Calls Today</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">200+</div>
                  <div className="text-xs text-gray-600">Countries</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">4.9★</div>
                  <div className="text-xs text-gray-600">Rating</div>
                </div>
              </div>

              {/* Testimonial */}
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-sm italic text-gray-700 mb-1">
                  "Crystal clear calls at half the price of Skype. Amazing
                  service!"
                </p>
                <p className="text-xs font-medium text-blue-600">
                  - Sarah T., Verified User
                </p>
              </div>
            </div>

            {/* Collapsible Sections */}
            <div className="space-y-3 mb-6">
              <details className="bg-white rounded-lg shadow-sm border border-gray-200">
                <summary className="p-3 font-medium cursor-pointer">
                  How does it work?
                </summary>
                <div className="p-3 pt-0 text-sm text-gray-600">
                  Enter any phone number, tap call, and connect instantly. Your
                  first call is free, and subsequent calls start at just
                  $0.03/minute.
                </div>
              </details>

              <details className="bg-white rounded-lg shadow-sm border border-gray-200">
                <summary className="p-3 font-medium cursor-pointer">
                  Why choose Zkypee over Skype?
                </summary>
                <div className="p-3 pt-0 text-sm text-gray-600">
                  Zkypee offers up to 50% lower rates, no subscription required,
                  HD call quality, and you can even transfer your existing Skype
                  credits.
                </div>
              </details>

              <details className="bg-white rounded-lg shadow-sm border border-gray-200">
                <summary className="p-3 font-medium cursor-pointer">
                  Is my information secure?
                </summary>
                <div className="p-3 pt-0 text-sm text-gray-600">
                  Yes! All calls are encrypted end-to-end, and we never share
                  your personal information with third parties.
                </div>
              </details>
            </div>

            {/* Secondary CTA */}
            <div className="mb-20">
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
          </main>
        </div>

        {/* Floating Action Button for calling - mobile only */}
        <div className="fixed bottom-6 right-6 z-50">
          <Link
            href="/dial"
            className="bg-green-600 hover:bg-green-700 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors"
          >
            <svg
              className="w-6 h-6"
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
          </Link>
        </div>
      </div>

      {/* Desktop Design - Only visible on medium screens and up */}
      <div className="hidden md:block">
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
                        Try calling for free now
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

              {/* Right side - Phone mockup */}
              <div className="w-full lg:w-1/2 flex justify-center mt-6 lg:mt-0">
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
      </div>
    </main>
  );
}
