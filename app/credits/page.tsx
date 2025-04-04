"use client";

import React from 'react';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CREDIT_PACKAGES } from "@/lib/stripe";
import { useAuth } from "@/contexts/AuthContext";
import Auth from "@/components/Auth";
import { motion } from "framer-motion";

export default function BuyCreditsPage() {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const handlePurchase = async (packageId: string) => {
    try {
      setIsProcessing(true);
      setSelectedPackage(packageId);

      if (!user) {
        setError("Please sign in to purchase credits");
        return;
      }

      const response = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ packageId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Error creating checkout session:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsProcessing(false);
      setSelectedPackage(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#00AFF0] to-[#0085B3] flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          <h1 className="text-3xl font-bold text-center text-white mb-8">
            Sign in to Purchase Credits
          </h1>
          <Auth />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#00AFF0] to-[#0085B3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Buy Credits
          </h1>
          <p className="text-xl text-white/80">
            Choose the package that best suits your needs
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="space-y-6">
            {CREDIT_PACKAGES.map((pkg) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 cursor-pointer"
                onClick={() => handlePurchase(pkg.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {pkg.credits} Credits
                    </h3>
                    <p className="text-white/80">
                      {pkg.credits === 100
                        ? "Perfect for occasional calls"
                        : pkg.credits === 300
                        ? "Most popular option"
                        : "Best value for heavy users"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">
                      ${pkg.amount}
                    </div>
                    <div className="text-white/60 text-sm">
                      ${(pkg.amount / pkg.credits).toFixed(2)}/credit
                    </div>
                  </div>
                </div>

                <button
                  className={`mt-4 w-full bg-white text-[#00AFF0] py-3 rounded-lg font-medium transition-all ${
                    isProcessing && selectedPackage === pkg.id
                      ? "opacity-75 cursor-not-allowed"
                      : "hover:bg-opacity-90"
                  }`}
                  disabled={isProcessing && selectedPackage === pkg.id}
                >
                  {isProcessing && selectedPackage === pkg.id ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </div>
                  ) : (
                    "Purchase Now"
                  )}
                </button>
              </motion.div>
            ))}
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-white text-center">{error}</p>
            </div>
          )}

          <div className="mt-12 bg-white/10 backdrop-blur-md rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Why Buy Credits?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-white mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Cost-Effective
                </h3>
                <p className="text-white/80">
                  Pay only for what you use with our flexible credit system
                </p>
              </div>
              <div>
                <div className="text-white mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Instant Access
                </h3>
                <p className="text-white/80">
                  Credits are added to your account immediately after purchase
                </p>
              </div>
              <div>
                <div className="text-white mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Secure Payments
                </h3>
                <p className="text-white/80">
                  All transactions are processed securely through Stripe
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
