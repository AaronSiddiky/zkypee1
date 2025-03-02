"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Background({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Navbar */}
      <header className="relative z-10 px-8 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/">
            <span className="text-blue-500 text-3xl font-bold">Z</span>
          </Link>
          
          <nav className="flex space-x-8">
            <Link href="/about" className="text-gray-700 hover:text-blue-500">
              About
            </Link>
            <Link href="/features" className="text-gray-700 hover:text-blue-500">
              Features
            </Link>
            <Link href="/reviews" className="text-gray-700 hover:text-blue-500">
              Reviews
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-blue-500">
              Contact
            </Link>
            <Link href="/faq" className="text-gray-700 hover:text-blue-500">
              FAQ
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Link href="/signup" className="text-gray-700 hover:text-blue-500">
              Try for free →
            </Link>
            <Link href="/download" className="bg-blue-500 text-white px-4 py-2 rounded-full flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </Link>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="relative z-10 px-8 pt-12">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center">
          {/* Left side content */}
          <div className="lg:w-1/2 lg:pr-12 mb-12 lg:mb-0">
            <div className="mb-2 text-gray-600">
              Make calls with ease!
            </div>
            <h1 className="text-5xl font-bold mb-6">
              <span className="text-blue-500">Zkypee</span>
              <br />
              <span>is an intuitive and</span>
              <br />
              <span>powerful app</span>
            </h1>
            
            <div className="flex space-x-4 mt-8">
              <Link href="/download" className="bg-blue-500 text-white px-6 py-3 rounded-full flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </Link>
              <Link href="/learn-more" className="text-blue-500 px-6 py-3 flex items-center">
                Learn more →
              </Link>
            </div>
          </div>
          
          {/* Right side - iPhone 16 mockup */}
          <div className="lg:w-1/2 flex justify-center">
            <div className="relative">
              {/* Phone frame - iPhone 16 style with titanium edges */}
              <div className="relative z-10 bg-gradient-to-b from-gray-400 to-gray-300 rounded-[55px] p-[3px] shadow-2xl">
                {/* Titanium frame effect */}
                <div className="absolute inset-0 rounded-[55px] bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 opacity-80"></div>
                
                {/* Inner frame */}
                <div className="relative bg-black rounded-[52px] overflow-hidden w-[340px] h-[680px] border-[3px] border-gray-800">
                  {/* Dynamic Island */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[130px] h-[35px] bg-black rounded-b-3xl z-20 mt-2 flex items-center justify-center">
                    {/* Front camera */}
                    <div className="absolute right-6 w-3 h-3 rounded-full bg-gray-800 ring-1 ring-gray-700 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                    </div>
                    
                    {/* Face ID sensors */}
                    <div className="absolute left-6 w-2 h-2 rounded-full bg-gray-800"></div>
                  </div>
                  
                  {/* Status bar */}
                  <div className="h-14 w-full bg-black text-white flex items-center justify-between px-8 pt-6">
                    <div className="text-xs font-medium">9:41</div>
                    <div className="flex space-x-1.5">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                        <path d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z" />
                      </svg>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                      </svg>
                      <div className="w-6 relative">
                        <div className="absolute inset-y-0 left-0 w-5 h-3 mt-0.5 bg-white rounded-sm"></div>
                        <div className="absolute inset-y-0 right-0 w-1 h-3 mt-0.5 bg-white rounded-sm ml-0.5"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* App content */}
                  <div className="bg-white h-full pt-14 pb-4 px-4">
                    {children}
                  </div>
                  
                  {/* Home indicator */}
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white rounded-full"></div>
                </div>
              </div>
              
              {/* Camera bump */}
              <div className="absolute top-24 -right-3 w-16 h-32 bg-gradient-to-b from-gray-400 to-gray-300 rounded-2xl z-0"></div>
              <div className="absolute top-28 -right-2 w-12 h-24 bg-gray-800 rounded-xl z-1 flex flex-col items-center justify-center space-y-3 p-1">
                <div className="w-9 h-9 rounded-full bg-gray-700 ring-1 ring-gray-600 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-gray-800 ring-1 ring-gray-700"></div>
                </div>
                <div className="w-9 h-9 rounded-full bg-gray-700 ring-1 ring-gray-600 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-gray-800 ring-1 ring-gray-700"></div>
                </div>
                <div className="w-9 h-9 rounded-full bg-gray-700 ring-1 ring-gray-600 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-gray-800 ring-1 ring-gray-700"></div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-blue-100 rounded-full opacity-50 blur-xl"></div>
              <div className="absolute -top-10 -left-10 w-48 h-48 bg-blue-100 rounded-full opacity-50 blur-xl"></div>
              
              {/* Volume buttons */}
              <div className="absolute top-32 -left-1 w-1 h-8 bg-gray-400 rounded-l-lg"></div>
              <div className="absolute top-44 -left-1 w-1 h-8 bg-gray-400 rounded-l-lg"></div>
              
              {/* Power button */}
              <div className="absolute top-32 -right-4 w-1 h-12 bg-gray-400 rounded-r-lg"></div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <div className="absolute bottom-8 left-8 z-10 text-gray-500">
        //EST. 2024
        <br />
        ZKYPEE
      </div>
    </div>
  );
}