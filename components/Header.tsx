"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Auth from '@/components/Auth';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/outline';

export default function Header() {
  const { user, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  return (
    <header className="bg-[#00AFF0] sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-white text-3xl font-bold">
              Z
            </Link>

            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="/ai-assistant"
                className="text-white hover:text-gray-100 text-sm font-medium transition-colors"
              >
                AI Voice Assistant
              </Link>
              <div className="relative group">
                <button
                  className="text-white hover:text-gray-100 text-sm font-medium transition-colors flex items-center"
                >
                  Free Tools
                  <svg
                    className="ml-1 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div
                  className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
                >
                  <Link
                    href="/receive-sms"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Receive SMS Online
                    <span className="block text-xs text-gray-500">
                      Free Temporary Phone Number
                    </span>
                  </Link>
                  <Link
                    href="/receive-email"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Receive Emails Online
                    <span className="block text-xs text-gray-500">
                      Free Temporary Email Address
                    </span>
                  </Link>
                </div>
              </div>
              <Link
                href="/credits"
                className="text-white hover:text-gray-100 text-sm font-medium transition-colors"
              >
                Buy Credits
              </Link>
              <Link
                href="/calling"
                className="text-white hover:text-gray-100 text-sm font-medium transition-colors"
              >
                Calling
              </Link>
              <Link
                href="/buy-number"
                className="text-white hover:text-gray-100 text-sm font-medium transition-colors"
              >
                Buy Phone Number
              </Link>
              <Link
                href="/about"
                className="text-white hover:text-gray-100 text-sm font-medium transition-colors"
              >
                About Us
              </Link>
              <Link
                href="/contact"
                className="text-white hover:text-gray-100 text-sm font-medium transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {!user ? (
              <button
                onClick={() => setShowAuth(true)}
                className="text-white hover:text-gray-100 text-sm font-medium transition-colors"
              >
                Login
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-white hover:text-gray-100 text-sm font-medium transition-colors group"
                >
                  <UserCircleIcon className="w-8 h-8" />
                  <span className="max-w-[150px] truncate">{user.email?.split('@')[0]}</span>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                    <Link
                      href="/earn"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Generate Referral Code
                    </Link>
                    <Link
                      href="/add-referral"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Add Referral Code
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
            <Link
              href="/dial"
              className="bg-white text-[#00AFF0] px-4 py-2 rounded-full text-sm font-medium hover:bg-opacity-90 transition-colors"
            >
              Try For Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      {showAuth && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowAuth(false)}
        >
          <div
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
          </div>
        </div>
      )}
    </header>
  );
} 