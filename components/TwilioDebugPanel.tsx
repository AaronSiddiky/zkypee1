"use client";

import React from "react";

interface TwilioDebugPanelProps {
  className?: string;
}

export default function TwilioDebugPanel({
  className = "",
}: TwilioDebugPanelProps) {
  return (
    <div className={`p-2 text-sm text-center text-gray-600 ${className}`}>
      Enter a phone number to call using Zkypee's VoIP service worldwide!
    </div>
  );
}
