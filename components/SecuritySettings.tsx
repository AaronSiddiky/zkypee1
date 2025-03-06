"use client";

import React, { useState, useEffect } from "react";
import {
  isTokenFilterActive,
  registerTokenFilterServiceWorker,
  unregisterTokenFilter,
} from "@/lib/serviceWorker";

export default function SecuritySettings() {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if the service worker is active
    const checkStatus = async () => {
      const active = await isTokenFilterActive();
      setIsActive(active);
      setLoading(false);
    };

    checkStatus();
  }, []);

  const handleToggle = async () => {
    setLoading(true);

    if (isActive) {
      // Disable the service worker
      await unregisterTokenFilter();
      setIsActive(false);
    } else {
      // Enable the service worker
      registerTokenFilterServiceWorker();
      // Wait a moment for registration to complete
      setTimeout(async () => {
        const active = await isTokenFilterActive();
        setIsActive(active);
      }, 500);
    }

    setLoading(false);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-2">Enhanced Security Settings</h3>

      <div className="flex items-center justify-between py-2">
        <div>
          <p className="font-medium">Network Request Filtering</p>
          <p className="text-sm text-gray-600">
            Hides sensitive authentication tokens in network requests
          </p>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={isActive}
            onChange={handleToggle}
            disabled={loading}
          />
          <div
            className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer ${
              isActive ? "peer-checked:bg-blue-600" : ""
            } peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}
          ></div>
        </label>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        {loading ? (
          <p>Updating settings...</p>
        ) : isActive ? (
          <p>
            ✅ Network request filtering is active. Sensitive tokens will be
            hidden in network requests.
          </p>
        ) : (
          <p>
            ⚠️ Network request filtering is disabled. Sensitive tokens may be
            visible in network requests.
          </p>
        )}
      </div>
    </div>
  );
}
