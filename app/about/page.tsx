"use client";

import { useEffect, useRef } from "react";

export default function AboutPage() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Ensure video autoplays with sound when component mounts
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.log("Autoplay failed:", error);
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">
        Why we built Zkypee👇
      </h1>
      <div className="w-full max-w-[400px] aspect-[9/16] relative bg-black rounded-lg overflow-hidden shadow-xl mb-12">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          controls={true}
          muted={false}
          loop
          playsInline
        >
          <source src="/about.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Simple Contact Section */}
      <div
        id="contact"
        className="w-full max-w-md bg-white rounded-xl shadow-md p-6 mt-8 text-center"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Contact Us</h2>
        <p className="text-gray-600 mb-6">
          Experiencing difficulties or need help? Reach out to us directly:
        </p>

        <div className="flex items-center justify-center space-x-2 text-blue-600">
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
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <a
            href="mailto:contact@zkypee.com"
            className="text-lg font-medium hover:underline"
          >
            contact@zkypee.com
          </a>
        </div>
      </div>
    </div>
  );
}
