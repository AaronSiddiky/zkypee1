import React from 'react';

export default function PurchaseNumberPage() {
  return (
    <div className="min-h-screen bg-[#00AFF0] text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-center mb-8">Purchase a Phone Number</h1>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-8">
            <div className="mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for area code or city..."
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xl font-semibold">+1 (555) 123-4567</p>
                    <p className="text-gray-300">New York, NY</p>
                  </div>
                  <div className="text-xl font-bold">$10/mo</div>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xl font-semibold">+1 (555) 987-6543</p>
                    <p className="text-gray-300">Los Angeles, CA</p>
                  </div>
                  <div className="text-xl font-bold">$10/mo</div>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xl font-semibold">+1 (555) 456-7890</p>
                    <p className="text-gray-300">Chicago, IL</p>
                  </div>
                  <div className="text-xl font-bold">$10/mo</div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button className="w-full bg-white text-[#00AFF0] px-6 py-3 rounded-full font-medium hover:bg-opacity-90 transition-colors">
                Purchase Selected Number
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 