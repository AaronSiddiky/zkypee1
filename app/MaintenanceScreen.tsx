"use client";

import React from "react";

const MaintenanceScreen = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center px-6 py-12 max-w-md mx-auto bg-white rounded-lg shadow-lg">
        <div className="mb-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto h-16 w-16 text-yellow-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Under Maintenance
        </h1>
        <p className="text-gray-600 mb-6">
          We're currently performing some scheduled maintenance on our systems.
          We'll be back online within the day. Thank you for your patience!
        </p>
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span>Our team is working hard to improve your experience</span>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceScreen;
