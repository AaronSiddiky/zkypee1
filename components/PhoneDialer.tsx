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
    if (!user) {
      setShowAuth(true);
      return;
    }
    
    setPhoneNumber(prev => prev + num);
  };
  
  const handleDelete = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    
    setPhoneNumber(prev => prev.slice(0, -1));
  };
  
  const handleCall = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    
    alert(`Calling ${phoneNumber}...`);
  };
  
  return (
    <>
      <div className="w-full h-full flex flex-col">
        {/* App header */}
        <div className="mb-4">
          <div className="flex items-center mb-1">
            <h2 className="text-xl font-semibold">Zkypee</h2>
            <div className="ml-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">Z</div>
          </div>
          <div className="text-sm text-gray-500">Make calls worldwide</div>
        </div>
        
        {/* Phone input */}
        <div className="bg-gray-50 rounded-3xl p-4 mb-6">
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => {
              if (!user) {
                setShowAuth(true);
                return;
              }
              setPhoneNumber(e.target.value);
            }}
            className="w-full text-2xl font-medium text-center py-2 bg-transparent border-b border-gray-200 mb-2 focus:outline-none"
            placeholder="Enter phone number"
            readOnly={!user}
          />
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">Credit: $8.86</div>
            <div className="flex space-x-2">
              <div className={`h-3 w-12 rounded-full ${phoneNumber ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
            </div>
          </div>
        </div>
        
        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((num, index) => (
            <motion.button
              key={index}
              onClick={() => handleNumberClick(num.toString())}
              className="h-14 w-14 rounded-full flex flex-col items-center justify-center mx-auto bg-gray-50 hover:bg-gray-100"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-xl font-medium">{num}</span>
              {num === 2 && <span className="text-[10px] text-gray-500">ABC</span>}
              {num === 3 && <span className="text-[10px] text-gray-500">DEF</span>}
              {num === 4 && <span className="text-[10px] text-gray-500">GHI</span>}
              {num === 5 && <span className="text-[10px] text-gray-500">JKL</span>}
              {num === 6 && <span className="text-[10px] text-gray-500">MNO</span>}
              {num === 7 && <span className="text-[10px] text-gray-500">PQRS</span>}
              {num === 8 && <span className="text-[10px] text-gray-500">TUV</span>}
              {num === 9 && <span className="text-[10px] text-gray-500">WXYZ</span>}
            </motion.button>
          ))}
        </div>
        
        {/* Call controls */}
        <div className="flex justify-between items-center mt-auto">
          <motion.button 
            className="p-3 rounded-full bg-gray-100"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (!user) {
                setShowAuth(true);
                return;
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </motion.button>
          
          <motion.button 
            onClick={handleCall}
            className="h-14 w-14 rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </motion.button>
          
          <motion.button 
            onClick={handleDelete} 
            className="p-3 rounded-full bg-gray-100"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          </motion.button>
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
              }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 