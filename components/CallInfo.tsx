"use client";

import { useState, useEffect } from "react";
import { useTwilio } from "../contexts/TwilioContext";
import Link from "next/link";
import {
  PhoneIcon,
  ClockIcon,
  CurrencyDollarIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import CallQualityIndicator from "./CallQualityIndicator";

export default function CallInfo() {
  const { isConnected, callDuration, estimatedCost, isMuted, toggleMute } =
    useTwilio();
  const [pulsating, setPulsating] = useState(true);
  const [showDurationWarning, setShowDurationWarning] = useState(false);

  // Start a pulsating animation when the call starts
  useEffect(() => {
    if (isConnected) {
      // Pulse for the first 5 seconds of the call
      const timer = setTimeout(() => {
        setPulsating(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  // Show warning when call duration exceeds 10 minutes
  useEffect(() => {
    if (callDuration > 600) {
      // 10 minutes
      setShowDurationWarning(true);
    }
  }, [callDuration]);

  // Format duration for display (MM:SS)
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // If not connected, don't show anything
  if (!isConnected) {
    return null;
  }

  return (
    <div className="p-5 bg-blue-50 border border-blue-200 rounded-lg mb-5 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <motion.div
            initial={{ scale: 1 }}
            animate={pulsating ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={{ duration: 1.5, repeat: pulsating ? Infinity : 0 }}
            className="w-3 h-3 bg-green-500 rounded-full mr-3"
          ></motion.div>
          <h3 className="font-medium text-blue-800 text-lg">
            Call in Progress
          </h3>
        </div>
        <div className="bg-blue-100 px-4 py-2 rounded-full text-blue-800 font-semibold flex items-center">
          <ClockIcon className="h-5 w-5 mr-2" />
          {formatDuration(callDuration)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
          <div className="text-xs text-gray-500 mb-1 flex items-center">
            <CurrencyDollarIcon className="h-4 w-4 mr-1" />
            Rate
          </div>
          <div className="font-medium text-gray-800">
            $
            {estimatedCost > 0
              ? ((estimatedCost / callDuration) * 60).toFixed(4)
              : "0.0000"}
            /min
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
          <div className="text-xs text-gray-500 mb-1 flex items-center">
            <CurrencyDollarIcon className="h-4 w-4 mr-1" />
            Current Cost
          </div>
          <div className="font-medium text-gray-800">
            ${estimatedCost.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Call quality indicator */}
      <div className="mb-4 bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
        <div className="text-xs text-gray-500 mb-2 flex items-center">
          Connection Quality
        </div>
        <CallQualityIndicator />
      </div>

      {/* Call control buttons */}
      <div className="flex justify-center space-x-3 mb-4">
        <motion.button
          onClick={toggleMute}
          className={`p-3 rounded-full flex items-center justify-center ${
            isMuted ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"
          }`}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
        >
          {isMuted ? (
            <SpeakerXMarkIcon className="h-6 w-6" />
          ) : (
            <SpeakerWaveIcon className="h-6 w-6" />
          )}
          <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
        </motion.button>
      </div>

      {/* Duration warning */}
      {showDurationWarning && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mt-3 text-sm text-yellow-800"
        >
          <p className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-2" />
            Your call has been active for over 10 minutes. Be mindful of your
            credit usage.
          </p>
        </motion.div>
      )}

      <div className="flex justify-between items-center pt-3 border-t border-blue-200">
        <div className="text-sm text-blue-700">
          <Link
            href="/calls/history"
            className="flex items-center hover:underline"
          >
            <PhoneIcon className="h-4 w-4 mr-1" />
            View Call History
          </Link>
        </div>
        <Link
          href="/credits"
          className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition-colors"
        >
          Add Credits
        </Link>
      </div>
    </div>
  );
}
