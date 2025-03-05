"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

// The warning will appear this many seconds before timeout
const WARNING_BEFORE_TIMEOUT = 120;

// Session timeout in minutes (must match the AuthContext value)
const SESSION_TIMEOUT_MINUTES = 45;

const InactivityWarningModal: React.FC = () => {
  const { user, signOut } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WARNING_BEFORE_TIMEOUT);

  useEffect(() => {
    if (!user) {
      setShowWarning(false);
      return;
    }

    let activityTimeout: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;

    const resetTimers = () => {
      clearTimeout(activityTimeout);
      clearInterval(countdownInterval);
      setShowWarning(false);

      // Set timeout to show warning before actual timeout
      const warningDelay =
        (SESSION_TIMEOUT_MINUTES * 60 - WARNING_BEFORE_TIMEOUT) * 1000;

      activityTimeout = setTimeout(() => {
        setTimeLeft(WARNING_BEFORE_TIMEOUT);
        setShowWarning(true);

        // Start countdown
        countdownInterval = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, warningDelay);
    };

    // Track user activity
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    // Add event listeners
    const handleUserActivity = () => {
      if (showWarning) {
        setShowWarning(false);
      }
      resetTimers();
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity);
    });

    // Initial setup
    resetTimers();

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
      clearTimeout(activityTimeout);
      clearInterval(countdownInterval);
    };
  }, [user, showWarning]);

  // Auto logout when timer reaches zero
  useEffect(() => {
    if (timeLeft === 0 && showWarning) {
      signOut();
    }
  }, [timeLeft, showWarning, signOut]);

  const continueSession = () => {
    setShowWarning(false);
  };

  const logoutNow = () => {
    signOut();
  };

  if (!showWarning) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-auto shadow-xl">
        <h3 className="text-xl font-bold text-red-600 mb-4">
          Session Timeout Warning
        </h3>

        <p className="mb-4">
          Your session will expire in{" "}
          <span className="font-bold">{timeLeft} seconds</span> due to
          inactivity.
        </p>

        <p className="mb-6 text-sm text-gray-600">
          For security reasons, you will be automatically logged out if you
          remain inactive.
        </p>

        <div className="flex justify-end space-x-4">
          <button
            onClick={logoutNow}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
          >
            Logout Now
          </button>

          <button
            onClick={continueSession}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Continue Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default InactivityWarningModal;
