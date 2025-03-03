"use client";

import React from "react";
import { TwilioProvider } from "../../contexts/TwilioContext";
import { AuthProvider } from "../../contexts/AuthContext";

export default function TestTwilioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
