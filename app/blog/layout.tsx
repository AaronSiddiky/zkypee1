import React from "react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zkypee Blog | Communication Tips & Best Skype Alternatives",
  description:
    "Learn about communication tools, tips, and the best Skype alternatives as Skype is shutting down. Discover why Zkypee is the perfect free Skype replacement.",
  keywords:
    "Skype alternative, Skype shutting down, free Skype replacement, communication tips",
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Blog Header */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                ← Back to Home
              </Link>
              <h1 className="text-3xl font-bold mt-2">Zkypee Blog</h1>
            </div>
            <div>
              <Link
                href="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm"
              >
                Try Zkypee Free
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/blog"
              className="text-sm bg-white py-1 px-3 rounded-full text-blue-700 hover:bg-blue-50"
            >
              All Posts
            </Link>
            <Link
              href="/blog/skype-shutting-down"
              className="text-sm bg-white py-1 px-3 rounded-full text-blue-700 hover:bg-blue-50"
            >
              Skype Alternatives
            </Link>
            <Link
              href="/features"
              className="text-sm bg-white py-1 px-3 rounded-full text-blue-700 hover:bg-blue-50"
            >
              Features
            </Link>
          </div>
        </div>
      </div>

      {children}

      {/* Blog Footer */}
      <div className="bg-gray-50 py-12 mt-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">
              Ready to Try the Best Skype Alternative?
            </h2>
            <p className="text-gray-600 mb-6">
              Don't wait until Skype shuts down completely. Switch to Zkypee
              today and enjoy better call quality, lower rates, and a modern
              interface.
            </p>
            <Link
              href="/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
            >
              Sign Up Free
            </Link>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <h3 className="font-semibold mb-4">Related Topics</h3>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/features"
                className="text-sm bg-gray-100 hover:bg-gray-200 py-1 px-3 rounded-full"
              >
                Features
              </Link>
              <Link
                href="/blog/skype-shutting-down"
                className="text-sm bg-gray-100 hover:bg-gray-200 py-1 px-3 rounded-full"
              >
                Skype Shutting Down
              </Link>
              <Link
                href="/about"
                className="text-sm bg-gray-100 hover:bg-gray-200 py-1 px-3 rounded-full"
              >
                About Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
