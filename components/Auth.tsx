"use client";

import React, { useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import ReCAPTCHA from "react-google-recaptcha";

// Helper function to get the base URL with a fallback to window.location.origin
function getBaseUrl() {
  if (typeof window !== "undefined") {
    // Use environment variable if available, otherwise fallback to window.location.origin
    return process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "";
}

interface AuthProps {
  onSuccess?: () => void;
}

export default function Auth({ onSuccess }: AuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaVerified(!!token);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate CAPTCHA for login (always require for login, optionally for signup)
    if (!isSignUp && !captchaVerified) {
      setError("Please complete the CAPTCHA verification");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up the user with auto-confirmation enabled
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Use the configured base URL with the callback path
            emailRedirectTo: `${getBaseUrl()}/auth/callback`,
            data: {
              email_confirmed: true, // Add custom user data indicating email is confirmed
            },
          },
        });

        if (signUpError) throw signUpError;

        // Immediately sign in the user without waiting for email confirmation
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (onSuccess) onSuccess();
      } else {
        // Regular sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      setError(err.message || "An error occurred during authentication");
      // Reset CAPTCHA on error
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setCaptchaVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);

    try {
      console.log(
        "Signing in with Google, redirect URL:",
        `${getBaseUrl()}/auth/callback`
      );
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${getBaseUrl()}/auth/callback`,
        },
      });

      if (error) throw error;
      // No need for onSuccess call here as the redirect will handle the completion
    } catch (err: any) {
      console.error("Google authentication error:", err);
      setError(err.message || "An error occurred during Google authentication");
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="w-full max-w-md bg-white rounded-xl shadow-xl p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        {isSignUp ? "Create Your Zkypee Account" : "Welcome Back to Zkypee"}
      </h2>

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

      {/* Google Sign In Button */}
      <motion.button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center py-2.5 px-4 mb-6 bg-white text-gray-800 rounded-md border border-gray-200 hover:bg-gray-50 focus:outline-none transition-colors duration-200"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {/* Original Google G Logo */}
        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </motion.button>

      <div className="relative flex items-center justify-center mb-6">
        <hr className="w-full border-gray-300" />
        <span className="absolute bg-white px-2 text-sm text-gray-500">
          Or continue with email
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
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

        <div className="mb-4">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            placeholder={
              isSignUp ? "Create a strong password" : "Enter your password"
            }
            required
          />
          {!isSignUp && (
            <div className="text-right mt-1">
              <a
                href="/auth/reset-password"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Forgot password?
              </a>
            </div>
          )}
        </div>

        {/* reCAPTCHA */}
        {!isSignUp && (
          <div className="mb-6">
            <div className="flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={
                  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
                  "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                }
                onChange={handleCaptchaChange}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              This site is protected by reCAPTCHA to prevent spam and automated
              abuse.
            </p>
          </div>
        )}

        <motion.button
          type="submit"
          disabled={loading || (!isSignUp && !captchaVerified)}
          className="w-full py-2.5 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 transition-colors duration-200 font-medium shadow-md"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
        </motion.button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setCaptchaVerified(false);
            if (recaptchaRef.current) {
              recaptchaRef.current.reset();
            }
          }}
          className="text-blue-500 hover:text-blue-700 text-sm font-medium transition-colors duration-200"
        >
          {isSignUp
            ? "Already have an account? Sign In"
            : "Need an account? Sign Up"}
        </button>
      </div>
    </motion.div>
  );
}
