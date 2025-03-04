"use client";

import React from "react";
import Link from "next/link";

export default function HamburgerMenu() {
  return (
    <div className="flex flex-col space-y-6 p-6 bg-white">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-blue-500">Z</h1>
        <button className="text-gray-500 text-2xl">&times;</button>
      </div>
      
      <h2 className="text-lg font-medium text-gray-700 mt-8">Features</h2>
      
      <div className="flex flex-col space-y-4 ml-2">
        <p className="text-gray-700">Transfer Skype Credits</p>
      </div>
      
      <div className="flex flex-col items-center space-y-4 mt-4">
        {/* Inline styled buttons with fixed width */}
        <button 
          style={{
            backgroundColor: '#82D091',
            color: 'white',
            borderRadius: '9999px',
            padding: '8px 16px',
            width: '160px',
            fontSize: '14px',
            fontWeight: '500',
            border: 'none'
          }}
        >
          Call Now
        </button>
        
        <button 
          style={{
            backgroundColor: '#4E84F7',
            color: 'white',
            borderRadius: '9999px',
            padding: '8px 16px',
            width: '160px',
            fontSize: '14px',
            fontWeight: '500',
            border: 'none'
          }}
        >
          Join Waitlist
        </button>
      </div>
      
      <div className="flex items-center space-x-2 mt-6 cursor-pointer">
        <span className="bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center">A</span>
        <span>Login</span>
      </div>
    </div>
  );
} 