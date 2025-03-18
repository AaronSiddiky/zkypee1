"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Default to the system phone number if none is selected
const DEFAULT_OUTGOING_NUMBER = "+13158722206";

type OutgoingNumberContextType = {
  selectedNumber: string;
  setSelectedNumber: (number: string) => void;
  resetToDefault: () => void;
};

const OutgoingNumberContext = createContext<
  OutgoingNumberContextType | undefined
>(undefined);

export function OutgoingNumberProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize from localStorage if available, otherwise use default
  const [selectedNumber, setSelectedNumberState] = useState<string>(
    DEFAULT_OUTGOING_NUMBER
  );

  // Load the selected number from localStorage on initial mount
  useEffect(() => {
    const savedNumber = localStorage.getItem("selectedOutgoingNumber");
    if (savedNumber) {
      setSelectedNumberState(savedNumber);
    }
  }, []);

  // Save to localStorage whenever it changes
  const setSelectedNumber = (number: string) => {
    setSelectedNumberState(number);
    localStorage.setItem("selectedOutgoingNumber", number);
    console.log(`Selected outgoing number changed to: ${number}`);
  };

  // Reset to the default system number
  const resetToDefault = () => {
    setSelectedNumberState(DEFAULT_OUTGOING_NUMBER);
    localStorage.removeItem("selectedOutgoingNumber");
    console.log("Reset to default outgoing number");
  };

  return (
    <OutgoingNumberContext.Provider
      value={{ selectedNumber, setSelectedNumber, resetToDefault }}
    >
      {children}
    </OutgoingNumberContext.Provider>
  );
}

export function useOutgoingNumber() {
  const context = useContext(OutgoingNumberContext);
  if (context === undefined) {
    throw new Error(
      "useOutgoingNumber must be used within an OutgoingNumberProvider"
    );
  }
  return context;
}
