"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTwilio, CallQuality } from "../contexts/TwilioContext";
import {
  SignalIcon,
  SignalSlashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface CallQualityIndicatorProps {
  compact?: boolean;
}

export default function CallQualityIndicator({
  compact = false,
}: CallQualityIndicatorProps) {
  const { callQuality, isConnected } = useTwilio();

  if (!isConnected) {
    return null;
  }

  // Define quality settings
  const qualitySettings = {
    [CallQuality.EXCELLENT]: {
      bars: 4,
      color: "text-green-500",
      bgColor: "bg-green-500",
      label: "Excellent",
      icon: <SignalIcon className="h-5 w-5" />,
    },
    [CallQuality.GOOD]: {
      bars: 3,
      color: "text-green-500",
      bgColor: "bg-green-500",
      label: "Good",
      icon: <SignalIcon className="h-5 w-5" />,
    },
    [CallQuality.FAIR]: {
      bars: 2,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500",
      label: "Fair",
      icon: <SignalIcon className="h-5 w-5" />,
    },
    [CallQuality.POOR]: {
      bars: 1,
      color: "text-red-500",
      bgColor: "bg-red-500",
      label: "Poor",
      icon: <ExclamationTriangleIcon className="h-5 w-5" />,
    },
    [CallQuality.UNKNOWN]: {
      bars: 0,
      color: "text-gray-400",
      bgColor: "bg-gray-400",
      label: "Unknown",
      icon: <SignalSlashIcon className="h-5 w-5" />,
    },
  };

  const settings = qualitySettings[callQuality];

  // Compact version just shows the icon with color
  if (compact) {
    return (
      <div className={`flex items-center ${settings.color}`}>
        {settings.icon}
      </div>
    );
  }

  // Full version shows bars and label
  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-end h-5 space-x-1">
        {[1, 2, 3, 4].map((bar) => (
          <motion.div
            key={bar}
            initial={{ height: "20%" }}
            animate={{
              height: bar <= settings.bars ? ["20%", "100%"] : "20%",
              opacity: bar <= settings.bars ? 1 : 0.3,
            }}
            transition={{
              duration: 0.4,
              ease: "easeOut",
              delay: bar * 0.1,
            }}
            className={`w-1.5 rounded-sm ${
              bar <= settings.bars ? settings.bgColor : "bg-gray-200"
            }`}
            style={{ height: `${bar * 25}%` }}
          />
        ))}
      </div>
      <span className={`text-sm ${settings.color}`}>{settings.label}</span>
    </div>
  );
}
