"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import PhoneContent from '../components/PhoneContent';

export default function HomePage() {
  const [showZkypee, setShowZkypee] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowZkypee(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-8 py-12 flex flex-col lg:flex-row items-center">
        <div className="lg:w-1/2 mb-12 lg:mb-0">
          <AnimatePresence>
            {showZkypee && (
              <motion.p 
                className="text-gray-600 mb-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Waitlist users get free 25 minutes. Zkypee launches on March 5, 2025.
              </motion.p>
            )}
          </AnimatePresence>
          
          <h1 className="text-5xl font-bold mb-6">
            <motion.div 
              initial={{ opacity: 1 }}
              animate={{ opacity: showZkypee ? 0.5 : 1, textDecoration: showZkypee ? 'line-through' : 'none' }}
              transition={{ duration: 0.5 }}
            >
              Skype is gone
            </motion.div>
            
            <AnimatePresence>
              {showZkypee && (
                <motion.div 
                  className="text-blue-500"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  Zkypee is here
                </motion.div>
              )}
            </AnimatePresence>
          </h1>
          <p className="text-xl mb-8">
            Transfer your Skype Credits and enjoy cheaper rates today
          </p>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-row space-x-4">
              <Link href="/signup" className="bg-blue-500 text-white px-8 py-3 rounded-full text-center">
                Join Waitlist
              </Link>
              <Link href="/features" className="text-blue-500 px-8 py-3 flex items-center justify-center">
                Learn more →
              </Link>
            </div>
            <p className="text-sm text-gray-700 font-medium mt-4">
              Made by Fellow betrayed Skype Users at Columbia University
            </p>
          </div>
        </div>
        
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
                
                {/* Phone content */}
                <div className="bg-white h-full pt-14 pb-4 px-4">
                  <PhoneContent />
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
      </main>
    </div>
  );
} 