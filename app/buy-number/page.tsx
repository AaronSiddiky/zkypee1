"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import Auth from "../../components/Auth";

export default function BuyNumberPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  const handleCountrySelect = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    router.push(`/buy-number/US`);
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#00AFF0] to-[#0078D4] p-0 m-0">
      {/* Background elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 pt-16 pb-24 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">
            Buy a Phone Number
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Select a country to view available phone numbers for your account
          </p>
        </div>

        <div className="flex justify-center mt-10">
          <button 
            className="group flex items-center space-x-4 bg-white/10 hover:bg-white/15 text-white p-6 rounded-xl cursor-pointer transition-all duration-300 backdrop-blur-sm border border-white/10 max-w-md w-full shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            onClick={handleCountrySelect}
          >
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <img 
                src="/flags/us.svg" 
                alt="US Flag" 
                className="w-10 h-10 drop-shadow-md"
              />
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-xl">United States</div>
              <div className="text-sm text-white/70 group-hover:text-white/90 transition-colors">Toll-free and local numbers available</div>
            </div>
            <div className="text-white/50 group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-white/70 text-sm max-w-md mx-auto">
            All numbers include voice capabilities and can be used for calling anywhere in the world
          </p>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowAuth(false)}
        >
          <div
            className="relative w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-300 hover:text-white z-10 transition-colors"
              onClick={() => setShowAuth(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <Auth onSuccess={() => setShowAuth(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
