"use client";

import React from 'react';

export default function AffiliatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00AFF0] to-[#0078D4] py-24 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-[#0078D4] rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-[#00AFF0] rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto text-center relative z-10">
        <h1 className="text-6xl font-bold text-white mb-6 tracking-tight">
          Join Our Affiliate Program
        </h1>
        <p className="text-2xl text-white/90 mb-16 max-w-3xl mx-auto">
          Earn money by sharing the power of free communication
        </p>

        <button 
          className="inline-flex items-center px-10 py-5 bg-white/95 backdrop-blur-sm rounded-full text-[#00AFF0] font-semibold text-xl hover:bg-white hover:scale-105 transition-all duration-200 mb-24 shadow-lg hover:shadow-xl"
          onClick={() => {}}
        >
          Become an Affiliate
          <svg className="w-6 h-6 ml-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-10 shadow-xl hover:bg-white/15 transition-all duration-300">
            <div className="text-white w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00AFF0] to-[#0078D4] flex items-center justify-center mb-6 mx-auto shadow-lg">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">High Commission</h3>
            <p className="text-white/80 text-lg">
              Earn 30% commission on every referral's first purchase
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-10 shadow-xl hover:bg-white/15 transition-all duration-300">
            <div className="text-white w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00AFF0] to-[#0078D4] flex items-center justify-center mb-6 mx-auto shadow-lg">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Lifetime Revenue</h3>
            <p className="text-white/80 text-lg">
              Get paid for as long as your referrals stay active
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-10 shadow-xl hover:bg-white/15 transition-all duration-300">
            <div className="text-white w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00AFF0] to-[#0078D4] flex items-center justify-center mb-6 mx-auto shadow-lg">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Quick Payouts</h3>
            <p className="text-white/80 text-lg">
              Get paid every month with no minimum threshold
            </p>
          </div>
        </div>

        <h2 className="text-5xl font-bold text-white mb-16">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { number: "01", title: "Sign Up" },
            { number: "02", title: "Share" },
            { number: "03", title: "Earn" }
          ].map((step, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-md rounded-3xl p-10 shadow-xl hover:bg-white/15 transition-all duration-300 relative group">
              <div className="text-8xl font-bold text-white/10 absolute top-8 left-8 group-hover:text-white/20 transition-all duration-300">
                {step.number}
              </div>
              <div className="relative z-10">
                <h3 className="text-3xl font-bold text-white mb-4">{step.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 