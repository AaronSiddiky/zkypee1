"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CREDIT_PACKAGES, COST_PER_MINUTE } from "@/lib/stripe";
import {
  FaCheck,
  FaInfoCircle,
  FaQuestionCircle,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import Auth from "@/components/Auth";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

// Declare a window property for session refresh tracking
declare global {
  interface Window {
    sessionRefreshed?: boolean;
  }
}

export default function CreditsPage() {
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const router = useRouter();

  // Track if we've already loaded credits to prevent duplicate calls
  const hasLoadedCredits = useRef(false);

  // Use the auth context
  const { session, user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user;

  // Clean up the session tracking when the component unmounts
  useEffect(() => {
    return () => {
      // Reset the session refresh flag when component unmounts
      if (typeof window !== "undefined") {
        window.sessionRefreshed = false;
      }
    };
  }, []);

  useEffect(() => {
    const checkAuthAndFetchBalance = async () => {
      if (authLoading) {
        console.log("Auth loading, waiting...");
        return; // Wait for auth to finish loading
      }

      if (isAuthenticated && user && !hasLoadedCredits.current) {
        console.log("User is authenticated, fetching credit balance");
        await fetchCreditBalance();
        hasLoadedCredits.current = true;
      } else if (!isAuthenticated) {
        console.log("User is not authenticated", {
          isAuthenticated,
          hasUser: !!user,
        });
        setIsLoading(false);
        setError("Please sign in to view your credits");
        // We'll show the auth UI
        setShowAuth(true);
      } else {
        console.log("Credits already loaded, skipping fetch");
      }
    };

    checkAuthAndFetchBalance();
  }, [isAuthenticated, user, authLoading]);

  const fetchCreditBalance = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Skip fetching if not authenticated
      if (!session) {
        console.log("No session available, skipping fetch");
        setIsLoading(false);
        setError("Please sign in to view your credits");
        return;
      }

      // Store the current token to use
      let tokenToUse = session.access_token;

      // Try to refresh session only once on component mount
      // We're using a more direct approach here to prevent infinite loops
      try {
        // We'll create a ref to store whether we already refreshed the session in this component lifecycle
        if (!window.sessionRefreshed) {
          const { data, error } = await supabase.auth.refreshSession();

          // Mark that we've already refreshed to prevent looping
          window.sessionRefreshed = true;

          if (error) {
            if (error.message.includes("rate limit")) {
              console.log("Rate limit hit, skipping refresh");
            } else {
              console.log("Failed to refresh session:", error.message);
            }
          } else if (data.session) {
            console.log("Session refreshed successfully");
            tokenToUse = data.session.access_token;
          }
        } else {
          console.log(
            "Session already refreshed in this session, skipping refresh"
          );
        }
      } catch (refreshError) {
        console.error("Error refreshing session:", refreshError);
      }

      console.log(
        "Fetching credit balance with token:",
        tokenToUse.substring(0, 10) + "..."
      );

      // Fetch credit balance with auth token
      const response = await fetch("/api/credits/balance", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
          "Content-Type": "application/json",
        },
        cache: "no-store", // Add cache busting
      });

      console.log("API response status:", response.status);

      const data = await response.json();
      console.log("API response data:", data);

      if (!response.ok) {
        // Handle different error scenarios
        if (data.error === "Database setup required") {
          throw new Error(
            "Database tables need to be set up. Please visit the setup page."
          );
        } else if (response.status === 401) {
          throw new Error("You must be signed in to view credits");
        } else {
          throw new Error(data.error || "Failed to fetch credit balance");
        }
      }

      // Set the credit balance from the response
      setCreditBalance(data.creditBalance);
      console.log("Credit balance fetched successfully:", data.creditBalance);
    } catch (err) {
      console.error("Error fetching credit balance:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    try {
      setIsProcessing(true);
      setSelectedPackage(packageId);
      setError(null);

      if (!session) {
        setShowAuth(true);
        return;
      }

      // Create checkout session with auth token in header
      const response = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ packageId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Error creating checkout session:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsProcessing(false);
      setSelectedPackage(null);
    }
  };

  const toggleFaq = (index: number) => {
    if (openFaqIndex === index) {
      setOpenFaqIndex(null);
    } else {
      setOpenFaqIndex(index);
    }
  };

  const faqs = [
    {
      question: "How do credits work?",
      answer:
        "Credits are used to make phone calls through our service. Each minute of call time costs a specific amount of credits. You can purchase credits in packages, and they will be added to your account balance.",
    },
    {
      question: "How much do calls cost?",
      answer: `Calls cost ${COST_PER_MINUTE} credits per minute. For example, a 10-minute call would cost ${
        10 * COST_PER_MINUTE
      } credits.`,
    },
    {
      question: "Do credits expire?",
      answer:
        "No, your credits do not expire and will remain in your account until used.",
    },
    {
      question: "Can I get a refund for unused credits?",
      answer:
        "We do not offer refunds for purchased credits. However, since credits don't expire, you can use them at any time.",
    },
    {
      question: "How do I check my credit balance?",
      answer:
        "Your current credit balance is displayed at the top of this page when you're logged in. You can also view your balance in the Credit Dashboard.",
    },
  ];

  const minutesRemaining =
    creditBalance !== null
      ? parseFloat((creditBalance / COST_PER_MINUTE).toFixed(2))
      : 0;

  // Show login message if not authenticated
  const renderAuthMessage = () => {
    if (!isAuthenticated && !authLoading) {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You need to be signed in to view and manage your credits.
                <button
                  onClick={() => setShowAuth(true)}
                  className="ml-2 font-medium underline text-yellow-700 hover:text-yellow-600"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderErrorMessage = () => {
    if (error) {
      return (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="container mx-auto p-4 sm:p-6 flex-1">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Credit Packages
          </h1>
          <p className="text-gray-600 mb-6">
            Purchase credits to make phone calls through our service
          </p>

          {/* Authentication message */}
          {renderAuthMessage()}

          {/* Error message */}
          {renderErrorMessage()}

          {/* Credit balance for authenticated users */}
          {isAuthenticated && !isLoading && creditBalance !== null && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-blue-800">
                    Your Credit Balance
                  </h2>
                  <p className="text-2xl font-bold text-blue-900">
                    {creditBalance} credits
                  </p>
                  <p className="text-sm text-blue-700">
                    Approximately {minutesRemaining} minutes of call time
                  </p>
                </div>
                <div className="mt-3 sm:mt-0"></div>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Loading...</span>
            </div>
          )}

          {/* Credit packages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {CREDIT_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className="border rounded-lg shadow-sm hover:shadow-md transition-shadow p-5"
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {pkg.name}
                </h3>
                <p className="text-3xl font-bold text-blue-600 mb-3">
                  ${pkg.amount}
                </p>
                <p className="text-gray-600 mb-4">{pkg.credits} credits</p>
                <ul className="mb-6 space-y-2">
                  <li className="flex items-start">
                    <FaCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-600">
                      Approximately {Math.round(pkg.credits / COST_PER_MINUTE)}{" "}
                      minutes of call time
                    </span>
                  </li>
                  <li className="flex items-start">
                    <FaCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-600">
                      Credits never expire
                    </span>
                  </li>
                </ul>
                <button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={isProcessing && selectedPackage === pkg.id}
                  className={`w-full py-2 rounded-md font-medium transition-colors ${
                    isProcessing && selectedPackage === pkg.id
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  {isProcessing && selectedPackage === pkg.id ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700"
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
                    </span>
                  ) : (
                    "Buy Now"
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border rounded-lg overflow-hidden transition-shadow hover:shadow-sm"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-4 text-left flex justify-between items-center focus:outline-none"
                >
                  <span className="font-medium text-gray-800">
                    {faq.question}
                  </span>
                  {openFaqIndex === index ? (
                    <FaChevronUp className="text-gray-500" />
                  ) : (
                    <FaChevronDown className="text-gray-500" />
                  )}
                </button>
                {openFaqIndex === index && (
                  <div className="p-4 bg-gray-50 border-t">
                    <p className="text-gray-700">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
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
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 z-10"
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
              <Auth
                onSuccess={() => {
                  setShowAuth(false);
                  fetchCreditBalance();
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
