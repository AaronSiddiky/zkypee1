import React from 'react';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#00AFF0] text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-center mb-8">Simple, Transparent Pricing</h1>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">Basic</h2>
            <div className="text-4xl font-bold mb-6">$10</div>
            <ul className="space-y-3 mb-8">
              <li>• 100 minutes calling</li>
              <li>• Basic video quality</li>
              <li>• Group calls up to 4 people</li>
            </ul>
            <Link 
              href="/credits"
              className="block text-center bg-white text-[#00AFF0] px-6 py-3 rounded-full font-medium hover:bg-opacity-90 transition-colors"
            >
              Buy Credits
            </Link>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 transform scale-105 border-2 border-white">
            <h2 className="text-2xl font-semibold mb-4">Pro</h2>
            <div className="text-4xl font-bold mb-6">$25</div>
            <ul className="space-y-3 mb-8">
              <li>• 300 minutes calling</li>
              <li>• HD video quality</li>
              <li>• Group calls up to 8 people</li>
              <li>• Screen sharing</li>
            </ul>
            <Link 
              href="/credits"
              className="block text-center bg-white text-[#00AFF0] px-6 py-3 rounded-full font-medium hover:bg-opacity-90 transition-colors"
            >
              Buy Credits
            </Link>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">Business</h2>
            <div className="text-4xl font-bold mb-6">$50</div>
            <ul className="space-y-3 mb-8">
              <li>• Unlimited calling</li>
              <li>• 4K video quality</li>
              <li>• Group calls up to 16 people</li>
              <li>• Advanced features</li>
            </ul>
            <Link 
              href="/credits"
              className="block text-center bg-white text-[#00AFF0] px-6 py-3 rounded-full font-medium hover:bg-opacity-90 transition-colors"
            >
              Buy Credits
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 