"use client";

import React, { useState } from "react";
import PhoneDialer from "../../components/PhoneDialer";
import { useAuth } from "../../contexts/AuthContext";
import Auth from "../../components/Auth";
import { motion, AnimatePresence } from "framer-motion";
import { TwilioProvider } from "../../contexts/TwilioContext";

export default function DialPage() {
  const [showAuth, setShowAuth] = useState(false);
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main content - positioned at top of screen */}
      <main className="flex-1 flex flex-col items-center pt-4 p-6">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
          {/* Removed redundant login button */}

          <TwilioProvider>
            <PhoneDialer user={user} loading={loading} />
          </TwilioProvider>

          {/* Removed redundant sign-in section */}
        </div>
      </main>

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
              <Auth onSuccess={() => setShowAuth(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
