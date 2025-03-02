"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function RatesPage() {
  const popularDestinations = [
    { country: "United States", rate: "$0.01", skypeRate: "$0.023" },
    { country: "United Kingdom", rate: "$0.01", skypeRate: "$0.024" },
    { country: "Canada", rate: "$0.01", skypeRate: "$0.023" },
    { country: "Australia", rate: "$0.02", skypeRate: "$0.037" },
    { country: "Germany", rate: "$0.01", skypeRate: "$0.023" },
    { country: "France", rate: "$0.01", skypeRate: "$0.023" },
    { country: "Japan", rate: "$0.03", skypeRate: "$0.065" },
    { country: "China", rate: "$0.02", skypeRate: "$0.041" },
    { country: "India", rate: "$0.01", skypeRate: "$0.025" },
    { country: "Brazil", rate: "$0.03", skypeRate: "$0.069" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div 
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-4">
          <span className="text-black">Zkypee Rates</span>
          <span className="text-blue-500"> - Save up to 50%</span>
        </h1>
        <p className="text-gray-600 mt-4">
          Enjoy crystal clear calls at a fraction of Skype's prices
        </p>
      </motion.div>
      
      {/* Pricing Plans */}
      <motion.div
        className="mb-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Basic Plan */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="text-xl font-semibold mb-2">Pay As You Go</div>
            <div className="text-gray-500 mb-4">No monthly fees</div>
            <div className="text-3xl font-bold text-blue-500 mb-6">$0.01<span className="text-sm text-gray-500">/min</span></div>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                No expiration on credits
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                HD voice quality
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Call any country
              </li>
            </ul>
            
            <Link href="/signup" className="block text-center bg-blue-500 text-white py-2 rounded-full hover:bg-blue-600 transition-colors">
              Get Started
            </Link>
          </div>
          
          {/* Standard Plan */}
          <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-100 p-6 hover:shadow-md transition-shadow relative">
            <div className="absolute -top-3 right-4 bg-blue-500 text-white text-xs px-3 py-1 rounded-full">
              POPULAR
            </div>
            <div className="text-xl font-semibold mb-2">Monthly Plan</div>
            <div className="text-gray-500 mb-4">Unlimited calls to 40+ countries</div>
            <div className="text-3xl font-bold text-blue-500 mb-6">$9.99<span className="text-sm text-gray-500">/month</span></div>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Unlimited minutes
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                HD voice & video
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Group calls up to 10 people
              </li>
            </ul>
            
            <Link href="/signup" className="block text-center bg-blue-500 text-white py-2 rounded-full hover:bg-blue-600 transition-colors">
              Get Started
            </Link>
          </div>
          
          {/* Premium Plan */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="text-xl font-semibold mb-2">Business Plan</div>
            <div className="text-gray-500 mb-4">For teams and businesses</div>
            <div className="text-3xl font-bold text-blue-500 mb-6">$19.99<span className="text-sm text-gray-500">/month</span></div>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Unlimited worldwide calls
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                4K video conferencing
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Group calls up to 50 people
              </li>
            </ul>
            
            <Link href="/signup" className="block text-center bg-blue-500 text-white py-2 rounded-full hover:bg-blue-600 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </motion.div>
      
      {/* Popular Destinations Table */}
      <motion.div
        className="mb-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-2xl font-bold mb-6">Popular Destinations</h2>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zkypee Rate
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Skype Rate
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Savings
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {popularDestinations.map((destination, index) => {
                // Calculate savings percentage
                const zkypeeRate = parseFloat(destination.rate.replace('$', ''));
                const skypeRate = parseFloat(destination.skypeRate.replace('$', ''));
                const savingsPercent = Math.round((1 - zkypeeRate / skypeRate) * 100);
                
                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {destination.country}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500 font-semibold">
                      {destination.rate}/min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="line-through">{destination.skypeRate}/min</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-500 font-semibold">
                      Save {savingsPercent}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
      
      {/* CTA Section */}
      <motion.div
        className="bg-blue-50 rounded-lg p-8 text-center mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <h2 className="text-2xl font-bold mb-4">Ready to save on your international calls?</h2>
        <p className="text-gray-600 mb-6">
          Sign up today and get a $5 credit to try Zkypee risk-free.
        </p>
        <div className="flex justify-center space-x-4">
          <Link href="/signup" className="bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 transition-colors">
            Sign Up
          </Link>
          <Link href="/transfer" className="text-blue-500 px-6 py-3 hover:text-blue-600 transition-colors">
            Transfer Skype Credits →
          </Link>
        </div>
      </motion.div>
      
      {/* Back to home */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center text-blue-500 hover:text-blue-600">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </div>
    </div>
  );
} 