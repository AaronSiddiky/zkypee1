"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { PhoneIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface FreeCallPopupProps {
  delay?: number; // Delay in ms before showing the popup
}

const FreeCallPopup: React.FC<FreeCallPopupProps> = ({ delay = 3000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [wasShown, setWasShown] = useState(false);

  useEffect(() => {
    // Check if we've already shown this popup in this session
    const popupShown = sessionStorage.getItem("freeCallPopupShown");
    if (popupShown) {
      setWasShown(true);
      return;
    }

    // Show the popup after the delay
    const timer = setTimeout(() => {
      setIsVisible(true);
      // Mark the popup as shown for this session
      sessionStorage.setItem("freeCallPopupShown", "true");
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const handleClose = () => {
    setIsVisible(false);
    setWasShown(true);
  };

  // If it was already shown in this session, don't render anything
  if (wasShown) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            {/* Popup */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>

              {/* Content */}
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <PhoneIcon className="w-8 h-8 text-blue-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Want to Make a Call Right Now?
                </h2>

                <p className="text-gray-600 mb-6">
                  Try our service completely free! No sign-up required. Call
                  anyone, anywhere in the world.
                </p>

                <div className="space-y-3">
                  <Link
                    href="/dial"
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-sm"
                  >
                    Try Calling for Free
                  </Link>

                  <button
                    onClick={handleClose}
                    className="block w-full text-gray-500 hover:text-gray-700 font-medium py-2"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FreeCallPopup;
