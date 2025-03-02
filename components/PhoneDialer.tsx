"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import Auth from './Auth';

export default function PhoneDialer() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const { user } = useAuth();
  
  const handleNumberClick = (num: string) => {
    setPhoneNumber(prev => prev + num);
  };
  
  const handleDelete = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };
  
  const handleCall = () => {
    if (!user) {
      // Show auth modal if user is not logged in
      setShowAuth(true);
      return;
    }
    
    alert(`Calling ${phoneNumber}...`);
    // In a real app, you would integrate with a calling API here
  };
  
  return (
    <>
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-500">Zkypee to Phone</div>
            <div className="text-sm font-medium">Credit: $8.86</div>
          </div>
          
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full text-2xl font-medium text-center py-2 border-b mb-4"
            placeholder="Enter phone number"
          />
        </div>
        
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((num, index) => (
            <button
              key={index}
              onClick={() => handleNumberClick(num.toString())}
              className="h-16 w-16 rounded-full flex flex-col items-center justify-center mx-auto hover:bg-gray-100"
            >
              <span className="text-2xl font-medium">{num}</span>
              {num === 2 && <span className="text-xs text-gray-500">abc</span>}
              {num === 3 && <span className="text-xs text-gray-500">def</span>}
              {num === 4 && <span className="text-xs text-gray-500">ghi</span>}
              {num === 5 && <span className="text-xs text-gray-500">jkl</span>}
              {num === 6 && <span className="text-xs text-gray-500">mno</span>}
              {num === 7 && <span className="text-xs text-gray-500">pqrs</span>}
              {num === 8 && <span className="text-xs text-gray-500">tuv</span>}
              {num === 9 && <span className="text-xs text-gray-500">wxyz</span>}
            </button>
          ))}
        </div>
        
        <div className="flex justify-between items-center mt-6">
          <button className="p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </button>
          
          <button 
            onClick={handleCall}
            className="h-16 w-16 rounded-full bg-blue-400 flex items-center justify-center hover:bg-blue-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          
          <button onClick={handleDelete} className="p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Auth Modal */}
      <AnimatePresence>
        {showAuth && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowAuth(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative"
              onClick={e => e.stopPropagation()}
            >
              <button 
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 z-10"
                onClick={() => setShowAuth(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <Auth onSuccess={() => {
                setShowAuth(false);
                // Automatically trigger the call after successful login
                setTimeout(() => {
                  alert(`Calling ${phoneNumber}...`);
                }, 500);
              }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 