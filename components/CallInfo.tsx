"use client";

import { useState, useEffect } from "react";
import { useTwilio } from "../contexts/TwilioContext";
import { COST_PER_MINUTE } from "@/lib/stripe";
import CreditBalance from "./CreditBalance";
import Link from "next/link";

export default function CallInfo() {
  const { isConnected, callDuration, estimatedCost } = useTwilio();

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
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-blue-800">Call in Progress</h3>
        <div className="bg-blue-100 px-3 py-1 rounded-full text-blue-800 font-medium">
          {formatDuration(callDuration)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="bg-white p-2 rounded border border-blue-100">
          <div className="text-xs text-gray-500 mb-1">Rate</div>
          <div className="font-medium">${COST_PER_MINUTE}/min</div>
        </div>
        <div className="bg-white p-2 rounded border border-blue-100">
          <div className="text-xs text-gray-500 mb-1">Current Cost</div>
          <div className="font-medium">${estimatedCost.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <CreditBalance className="text-sm" />
        <Link
          href="/credits"
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
        >
          Add Credits
        </Link>
      </div>
    </div>
  );
}
