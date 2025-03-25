"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { TwilioProvider } from "../contexts/TwilioContext";
import Auth from "../components/Auth";
import CreditBalance from "../components/CreditBalance";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import InactivityWarningModal from "../components/InactivityWarningModal";
import { Analytics } from "@vercel/analytics/react";

function NavbarContent() {
  const { user, loading, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Add click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/"); // Redirect to home page after logout
      router.refresh(); // Refresh the page to update the auth state
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <>
      <header className="relative z-10 px-4 sm:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/">
            <span className="text-blue-500 text-3xl font-bold">Z</span>
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden flex items-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          <div className="hidden md:flex items-center">
            <nav className="flex items-center space-x-4 lg:space-x-8 mr-4 lg:mr-8">
              <Link
                href="/dial"
                className="bg-green-500 text-white px-4 sm:px-6 py-2 rounded-full hover:bg-green-600"
              >
                Call Now
              </Link>
              <Link
                href="/credits"
                className="text-gray-700 hover:text-blue-500"
              >
                Buy Credits
              </Link>
              <Link
                href="/buy-number"
                className="text-gray-700 hover:text-blue-500"
              >
                Purchase Number
              </Link>
              <Link
                href="/my-numbers"
                className="text-gray-700 hover:text-blue-500"
              >
                My Numbers
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-blue-500">
                About Us
              </Link>
              <Link
                href="/about#contact"
                className="text-gray-700 hover:text-blue-500"
              >
                Contact Us
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
              <div className="flex items-center">
                {/* Credit balance - display next to profile logo */}
                <div className="mr-3 px-3 py-1 bg-gray-100 rounded-lg border border-gray-200 shadow-sm">
                  <CreditBalance showBuyButton={false} />
                </div>

                <div className="relative group" ref={profileMenuRef}>
                  <button
                    className="flex items-center space-x-2"
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                      {user?.email?.charAt(0).toUpperCase() || "U"}
                    </div>
                  </button>
                  <div
                    className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 transition-all duration-200 z-50 ${
                      profileMenuOpen
                        ? "opacity-100 visible"
                        : "opacity-0 invisible"
                    }`}
                  >
                    <Link
                      href="/earn"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Earn $1 per Referral
                    </Link>
                    <Link
                      href="/add-referral"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Add Referral Code
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-200 px-4 py-4 shadow-lg"
          >
            <nav className="flex flex-col space-y-4 py-2">
              {/* Credit balance in mobile menu */}
              {!loading && user && (
                <div className="py-3 px-4 my-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-blue-500 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path
                          fillRule="evenodd"
                          d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="font-medium text-gray-700">
                        Your Balance
                      </span>
                    </div>
                    <CreditBalance
                      showBuyButton={false}
                      className="text-blue-600 font-bold"
                    />
                  </div>
                </div>
              )}

              <Link
                href="/credits"
                className="text-gray-700 hover:text-blue-500 py-2 font-medium text-center flex items-center justify-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mr-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path
                      fillRule="evenodd"
                      d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                Buy Credits
              </Link>

              {/* Purchase Local Number link */}
              <Link
                href="/purchase-local-number"
                className="text-gray-700 hover:text-blue-500 py-2 font-medium text-center flex items-center justify-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mr-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </span>
                Purchase Local Number
              </Link>

              {/* My Numbers link */}
              <Link
                href="/my-numbers"
                className="text-gray-700 hover:text-blue-500 py-2 font-medium text-center flex items-center justify-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mr-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </span>
                My Numbers
              </Link>

              {/* About Us link */}
              <Link
                href="/about"
                className="text-gray-700 hover:text-blue-500 py-2 font-medium text-center flex items-center justify-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mr-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                About Us
              </Link>

              {/* Contact Us link */}
              <Link
                href="/about#contact"
                className="text-gray-700 hover:text-blue-500 py-2 font-medium text-center flex items-center justify-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mr-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </span>
                Contact Us
              </Link>

              {/* Call Now button - made more prominent */}
              <Link
                href="/dial"
                className="bg-green-500 text-white px-6 py-3 rounded-full hover:bg-green-600 text-center font-medium flex items-center justify-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mr-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </span>
                Call Now
              </Link>

              {/* Login/Profile for mobile */}
              {!loading && !user ? (
                <button
                  onClick={() => {
                    setShowAuth(true);
                    setMobileMenuOpen(false);
                  }}
                  className="text-gray-700 hover:text-blue-500 font-medium py-3 text-center flex items-center justify-center"
                >
                  <span className="mr-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  Login
                </button>
              ) : (
                <div className="py-3 flex flex-col">
                  <Link
                    href="/earn"
                    className="text-gray-700 hover:text-blue-500 font-medium py-2 flex items-center justify-center"
                  >
                    <span className="mr-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    Earn $1 per Referral
                  </Link>
                  <Link
                    href="/add-referral"
                    className="text-gray-700 hover:text-blue-500 font-medium py-2 flex items-center justify-center"
                  >
                    <span className="mr-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    Add Referral Code
                  </Link>
                  <button
                    onClick={async () => {
                      await handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="text-gray-700 hover:text-blue-500 font-medium py-2 flex items-center justify-center border-t border-gray-100 mt-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium mr-2">
                      {user?.email?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="relative w-full max-w-md"
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
        <InactivityWarningModal />
        <Analytics />
        {children}
      </TwilioProvider>
    </AuthProvider>
  );
}
