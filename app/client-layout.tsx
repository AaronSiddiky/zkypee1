"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { TwilioProvider } from "../contexts/TwilioContext";
import Auth from "../components/Auth";
import { motion, AnimatePresence } from "framer-motion";

function NavbarContent() {
  const { user, loading, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <header className="relative z-10 px-8 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/">
            <span className="text-blue-500 text-3xl font-bold">Z</span>
          </Link>

          <div className="flex items-center">
            <nav className="flex items-center space-x-8 mr-8">
              <Link
                href="/features"
                className="text-gray-700 hover:text-blue-500"
              >
                Features
              </Link>
              <Link
                href="/transfer"
                className="text-gray-700 hover:text-blue-500"
              >
                Transfer Skype Credits
              </Link>
              <Link
                href="/dial"
                className="bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600"
              >
                Call Now
              </Link>
              <Link
                href="/signup"
                className="bg-blue-500 text-white px-6 py-2 rounded-full"
              >
                Join Waitlist
              </Link>
            </nav>

            {/* Profile login/logout button - positioned at the far right */}
            {!loading && !user ? (
              <button
                onClick={() => setShowAuth(true)}
                className="text-gray-700 hover:text-blue-500 font-medium"
              >
                Login
              </button>
            ) : (
              <div className="relative group">
                <button className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <button
                    onClick={signOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

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
    </>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <TwilioProvider>
        <NavbarContent />
        {children}
      </TwilioProvider>
    </AuthProvider>
  );
}
