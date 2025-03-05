"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import { COST_PER_MINUTE } from "@/lib/stripe";

// Updated interface without any token or device references
interface TwilioContextType {
  isReady: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  makeCall: (phoneNumber: string) => Promise<boolean>;
  hangUp: () => void;
  error: string | null;
  needsUserInteraction: boolean;
  initializeDevice: () => Promise<boolean>;
  testConnection: () => Promise<{
    success: boolean;
    status: string;
    isReady: boolean;
    apiResponse: any;
    error: string | null;
  }>;
  debugInfo: {
    lastAction: string;
    timestamp: number;
    status: string | null;
    error: string | null;
  };
  connection: any;
  callDuration: number;
  estimatedCost: number;
  insufficientCredits: boolean;
  checkCredits: (durationMinutes: number) => Promise<boolean>;
  isMuted: boolean;
  toggleMute: () => void;
}

const TwilioContext = createContext<TwilioContextType | undefined>(undefined);

export function TwilioProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCall, setActiveCall] = useState<any>(null);
  const { user, loading: authLoading } = useAuth();
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    lastAction: string;
    timestamp: number;
    status: string | null;
    error: string | null;
  }>({
    lastAction: "initial",
    timestamp: Date.now(),
    status: null,
    error: null,
  });
  const [connection, setConnection] = useState<any>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Add necessary refs for tracking
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to update debug info
  const updateDebugInfo = (
    action: string,
    status: string | null = null,
    errorMsg: string | null = null
  ) => {
    console.log(
      `[DEBUG] ${action} - Status: ${status || "unknown"} ${
        errorMsg ? `- Error: ${errorMsg}` : ""
      }`
    );
    setDebugInfo({
      lastAction: action,
      timestamp: Date.now(),
      status: status,
      error: errorMsg,
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up any active resources
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  // Check if user has enough credits for a call
  const checkCredits = async (durationMinutes: number = 10) => {
    try {
      const response = await fetch("/api/credits/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ durationMinutes }),
        credentials: "same-origin",
      });

      const data = await response.json();

      // Update state based on credit check result
      setInsufficientCredits(!data.hasEnoughCredits);
      return data.hasEnoughCredits;
    } catch (error) {
      console.error("Error checking credits:", error);
      // Assume not enough credits in case of error
      setInsufficientCredits(true);
      return false;
    }
  };

  // Start tracking call duration
  const startDurationTracking = () => {
    setCallDuration(0);
    setEstimatedCost(0);

    // Clear any existing interval
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    // Set up a new interval to update duration and cost
    durationIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => {
        const newDuration = prev + 1;
        // Update estimated cost (convert to minutes)
        setEstimatedCost(
          parseFloat(((newDuration / 60) * COST_PER_MINUTE).toFixed(2))
        );
        return newDuration;
      });
    }, 1000); // Update every second
  };

  // Stop tracking call duration
  const stopDurationTracking = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  // Deduct credits after a call
  const deductCredits = async () => {
    if (callDuration <= 0) return;

    try {
      // Convert seconds to minutes (rounded up)
      const durationMinutes = Math.ceil(callDuration / 60);

      await fetch("/api/credits/deduct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ durationMinutes }),
        credentials: "same-origin",
      });
    } catch (error) {
      console.error("Error deducting credits:", error);
    }
  };

  // Server-side token approach for making calls
  const makeCall = async (phoneNumber: string): Promise<boolean> => {
    try {
      if (!user || !user.id) {
        setError("You must be signed in to make calls");
        return false;
      }

      // Check if user has enough credits
      const hasEnoughCredits = await checkCredits(10); // Check for 10 minutes
      if (!hasEnoughCredits) {
        setError(
          "Insufficient credits. Please add more credits to make calls."
        );
        return false;
      }

      setIsConnecting(true);
      updateDebugInfo("makeCall_start");

      // Initialize Twilio capabilities server-side
      const initResponse = await fetch("/api/twilio/token", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        setError(errorData.error || "Failed to initialize call capabilities");
        setIsConnecting(false);
        return false;
      }

      // Make the call through our proxy API
      const callResponse = await fetch("/api/twilio/voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber }),
        credentials: "same-origin",
      });

      if (!callResponse.ok) {
        const errorData = await callResponse.json();
        setError(errorData.error || "Failed to initiate call");
        setIsConnecting(false);
        return false;
      }

      const callData = await callResponse.json();

      // Call initiated successfully
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);

      // Start tracking call duration
      startDurationTracking();

      return true;
    } catch (err: any) {
      console.error("Error making call:", err);
      setError(`Call failed: ${err.message || "Unknown error"}`);
      setIsConnecting(false);
      return false;
    }
  };

  // Server-side hangup implementation
  const hangUp = () => {
    try {
      // Call the hangup endpoint
      fetch("/api/twilio/hangup", {
        method: "POST",
        credentials: "same-origin",
      }).catch((err) => {
        console.error("Error hanging up call:", err);
      });

      // Reset local state
      setIsConnected(false);
      stopDurationTracking();
      deductCredits(); // Deduct credits for the call duration
      setError(null);
    } catch (error) {
      console.error("Error hanging up call:", error);
    }
  };

  // Toggle mute state
  const toggleMute = () => {
    try {
      const newMuteState = !isMuted;

      // Call API to update mute state
      fetch("/api/twilio/mute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ muted: newMuteState }),
        credentials: "same-origin",
      }).catch((err) => {
        console.error("Error toggling mute:", err);
      });

      setIsMuted(newMuteState);
    } catch (error) {
      console.error("Error toggling mute:", error);
    }
  };

  // Simple test connection function
  const testConnection = async () => {
    try {
      // Try to initialize the server-side token
      const response = await fetch("/api/twilio/token", {
        method: "POST",
        credentials: "same-origin",
      });

      const success = response.ok;
      const apiResponse = await response.json();

      return {
        success,
        status: success ? "ready" : "error",
        isReady: success,
        apiResponse,
        error: success ? null : "Connection test failed",
      };
    } catch (error: any) {
      console.error("Error in testConnection:", error);

      return {
        success: false,
        status: "error",
        isReady: false,
        apiResponse: null,
        error: `Test failed: ${error.message || "Unknown error"}`,
      };
    }
  };

  // Initialize device (server-side only)
  const initializeDevice = async (): Promise<boolean> => {
    try {
      if (!user || !user.id) {
        setError("You must be signed in to make calls");
        return false;
      }

      // Just initialize the server-side token
      const response = await fetch("/api/twilio/token", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to initialize Twilio");
        return false;
      }

      setIsReady(true);
      setError(null);
      return true;
    } catch (error: any) {
      console.error("Error initializing:", error);
      setError(`Initialization failed: ${error.message || "Unknown error"}`);
      return false;
    }
  };

  // Provide the context value
  const contextValue: TwilioContextType = {
    isReady,
    isConnecting,
    isConnected,
    makeCall,
    hangUp,
    error,
    needsUserInteraction,
    initializeDevice,
    testConnection,
    debugInfo,
    connection,
    callDuration,
    estimatedCost,
    insufficientCredits,
    checkCredits,
    isMuted,
    toggleMute,
  };

  return (
    <TwilioContext.Provider value={contextValue}>
      {children}
    </TwilioContext.Provider>
  );
}

export function useTwilio() {
  const context = useContext(TwilioContext);
  if (context === undefined) {
    throw new Error("useTwilio must be used within a TwilioProvider");
  }
  return context;
}
