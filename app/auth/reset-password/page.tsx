"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

// Helper function to get the base URL with a fallback to window.location.origin
function getBaseUrl() {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "";
}

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await resetPassword(email);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err.message || "An error occurred during password reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <motion.div
        className="w-full max-w-md bg-white rounded-xl shadow-xl p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {isSubmitted ? (
          <>
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
              Check Your Email
            </h2>
            <p className="mb-6 text-gray-600 text-center">
              If an account exists with the email <strong>{email}</strong>, we
              have sent password reset instructions to your inbox.
            </p>
            <p className="mb-6 text-gray-600 text-center">
              Please check your email and follow the instructions to reset your
              password.
            </p>
            <Link href="/">
              <motion.button
                className="w-full py-2.5 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium shadow-md"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                Return to Home
              </motion.button>
            </Link>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
              Reset Your Password
            </h2>
            <p className="mb-6 text-gray-600 text-center">
              Enter your email address and we'll send you instructions to reset
              your password.
            </p>

            {error && (
              <motion.div
                className="mb-4 p-3 bg-red-100 text-red-700 rounded-md border border-red-200"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.2 }}
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 transition-colors duration-200 font-medium shadow-md"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {loading ? "Processing..." : "Reset Password"}
              </motion.button>

              <div className="mt-4 text-center">
                <Link
                  href="/"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Return to Sign In
                </Link>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
