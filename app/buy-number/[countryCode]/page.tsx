"use client";

import React from "react";
import { useParams } from "next/navigation";
import NumberList from "../../../components/NumberList";
import Link from "next/link";

export default function CountryNumbersPage() {
  const params = useParams();
  const countryCode = params.countryCode as string;

  return (
    <div className="bg-gradient-to-br from-[#00AFF0] to-[#0078D4] p-0 m-0">
      {/* Background elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 pt-10 pb-24 relative z-10">
        <div className="mb-8">
          <Link 
            href="/buy-number" 
            className="text-white hover:text-white flex items-center transition-all hover:-translate-x-1 duration-200 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:mr-3 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Countries
          </Link>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">
            Available Phone Numbers
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Browse {countryCode === "US" ? "United States" : countryCode} numbers and choose the perfect one for your needs
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/10 transition-all duration-300">
          <NumberList countryCode={countryCode} />
        </div>
        
        <div className="mt-10 text-center">
          <p className="text-white/70 text-sm max-w-md mx-auto">
            All phone numbers are billed monthly and can be cancelled at any time
          </p>
        </div>
      </div>
    </div>
  );
}
