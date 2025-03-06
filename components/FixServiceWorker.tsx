"use client";

import React, { useState } from "react";
import { unregisterTokenFilter } from "@/lib/serviceWorker";

export default function FixServiceWorker() {
  const [fixing, setFixing] = useState(false);
  const [fixed, setFixed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFix = async () => {
    setFixing(true);
    setError(null);

    try {
      // Unregister the service worker
      const unregistered = await unregisterTokenFilter();

      if (unregistered) {
        setFixed(true);
        // Force reload the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setError(
          "No service worker found to unregister. Try reloading the page."
        );
      }
    } catch (err) {
      setError(
        "Error fixing service worker: " +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
      <h3 className="text-lg font-semibold text-red-800 mb-2">
        Service Worker Issue Detected
      </h3>
      <p className="text-sm text-red-700 mb-3">
        A service worker issue might be preventing the app from working
        correctly.
      </p>

      {error && (
        <div className="text-sm text-red-800 bg-red-100 p-2 rounded mb-3">
          {error}
        </div>
      )}

      {fixed ? (
        <div className="text-sm text-green-700 bg-green-100 p-2 rounded mb-3">
          Service worker successfully unregistered. Reloading page...
        </div>
      ) : (
        <button
          onClick={handleFix}
          disabled={fixing}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
        >
          {fixing ? "Fixing..." : "Fix Issue"}
        </button>
      )}
    </div>
  );
}
