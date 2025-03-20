"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ResetPasswordConfirm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [hashChecked, setHashChecked] = useState(false);
  const [tokenValue, setTokenValue] = useState("");
  const router = useRouter();

  // Validate that we have a hash parameter for reset
  useEffect(() => {
    // Check URL hash for reset token
    const checkForToken = async () => {
      // First check if there's a hash in the URL
      if (typeof window !== "undefined") {
        // In client-side code
        const hash = window.location.hash;
        const type = new URLSearchParams(window.location.search).get("type");

        console.log("Hash present:", !!hash);
        console.log("URL type:", type);
        console.log("Full window location:", window.location.href);

        if (hash && hash.includes("access_token=")) {
          console.log("Found access token in URL");
          setHashChecked(true);

          // Extract the token for debugging only (don't store it as state normally)
          const accessToken = hash.split("access_token=")[1]?.split("&")[0];
          if (accessToken) {
            setTokenValue("Valid token found (not displayed for security)");
          }
        } else if (type === "recovery") {
          console.log("Recovery type parameter found");
          setHashChecked(true);
        } else {
          // If no hash or not a recovery type, show error
          setError(
            "Invalid or expired password reset link. No access token found in URL."
          );
          console.error("No access token found in URL hash");
        }
      }
    };

    checkForToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        // Redirect to home page after successful password reset
        router.push("/");
      }, 3000);
    } catch (err: any) {
      console.error("Error resetting password:", err);
      setError(err.message || "Failed to reset password");
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
        {success ? (
          <>
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
              Password Reset Successful!
            </h2>
            <p className="mb-6 text-gray-600 text-center">
              Your password has been reset successfully. You will be redirected
              to the login page in a few seconds.
            </p>
            <Link href="/">
              <motion.button
                className="w-full py-2.5 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium shadow-md"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                Go to Login
              </motion.button>
            </Link>
          </>
        ) : !hashChecked ? (
          <>
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
              Password Reset Error
            </h2>
            <p className="mb-6 text-gray-600 text-center">
              {error || "Invalid or expired password reset link."}
            </p>
            {tokenValue && (
              <p className="mb-6 text-gray-600 text-center text-xs">
                Debug info: {tokenValue}
              </p>
            )}
            <Link href="/auth/reset-password">
              <motion.button
                className="w-full py-2.5 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium shadow-md"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                Try Again
              </motion.button>
            </Link>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
              Create New Password
            </h2>
            <p className="mb-6 text-gray-600 text-center">
              Please enter your new password below.
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
              <div className="mb-4">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter your new password"
                  required
                  minLength={8}
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Confirm your new password"
                  required
                  minLength={8}
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
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
