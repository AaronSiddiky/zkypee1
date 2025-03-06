"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with the latest API key
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://xjslipdzcbdjteqnawpt.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc2xpcGR6Y2JkanRlcW5hd3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MzcxMDMsImV4cCI6MjA1NjUxMzEwM30.yfgMsfGMzf1KE7XGWIunR5oKZBr3SKYBQv4anLcqCA8";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email) {
      setError("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Insert data into Supabase
      const { error: supabaseError } = await supabase
        .from("waitlist")
        .insert([{ name, email, created_at: new Date().toISOString() }]);

      if (supabaseError) throw supabaseError;

      // Success!
      setIsSuccess(true);
      setName("");
      setEmail("");
    } catch (err: any) {
      console.error("Error submitting to waitlist:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-md mx-auto px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Join the Zkypee Waitlist</h1>
          <p className="text-gray-600">
            Be the first to know when Zkypee launches and get early access to
            our platform.
          </p>
        </div>

        {isSuccess ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <svg
              className="w-16 h-16 text-green-500 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-semibold mb-2">You're on the list!</h2>
            <p className="text-gray-600 mb-6">
              Thanks for joining our waitlist. We'll notify you when Zkypee is
              ready.
            </p>
            <Link href="/" className="text-blue-500 hover:underline">
              Return to home page
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-gray-50 rounded-lg p-6 shadow-sm"
          >
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="John Doe"
                required
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-blue-500 text-white py-2 px-4 rounded-full font-medium ${
                isSubmitting
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:bg-blue-600"
              }`}
            >
              {isSubmitting ? "Submitting..." : "Join Waitlist"}
            </button>

            <p className="text-xs text-gray-500 mt-4 text-center">
              We'll never share your information with third parties.
            </p>
          </form>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-8 py-6 text-center text-sm text-gray-500">
        <p>Made by Fellow betrayed Skype Users at Columbia University</p>
      </footer>
    </div>
  );
}
