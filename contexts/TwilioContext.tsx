"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { COST_PER_MINUTE } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import { Device } from "@twilio/voice-sdk";
import type { Call } from "@twilio/voice-sdk";
import {
  registerTokenFilterServiceWorker,
  unregisterTokenFilter,
} from "@/lib/serviceWorker";
import {
  trackTrialStart,
  trackTrialComplete,
  trackTrialError,
  trackCallMetrics,
  getTrialVariant,
} from "@/lib/analytics";
import { getClientFingerprint } from "@/lib/trial-limitations";

// Constants for token rotation
const TOKEN_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds
const TOKEN_REFRESH_BUFFER = 60 * 1000; // 1 minute buffer before expiration

// Helper function to suppress Twilio token logs
const suppressTwilioTokenLogs = (callback: () => Promise<any>) => {
  // Store the original console methods
  const originalConsoleLog = console.log;
  const originalConsoleInfo = console.info;

  // Create a filtering wrapper for console.log
  console.log = function (...args) {
    // Check if this is a Twilio token log
    const firstArg = args[0]?.toString() || "";
    if (
      (typeof firstArg === "string" &&
        firstArg.includes("[TwilioVoice]") &&
        (args.some((arg) => typeof arg === "string" && arg.includes("token")) ||
          JSON.stringify(args).includes("token"))) ||
      args.some(
        (arg) =>
          typeof arg === "object" &&
          arg !== null &&
          JSON.stringify(arg).includes('token":')
      )
    ) {
      // Replace token with [REDACTED] in logs
      const sanitizedArgs = args.map((arg) => {
        if (typeof arg === "string") {
          return arg.replace(/("token":")([^"]+)(")/g, "$1[REDACTED]$3");
        } else if (typeof arg === "object" && arg !== null) {
          const stringified = JSON.stringify(arg);
          if (stringified.includes("token")) {
            const sanitized = stringified.replace(
              /("token":")([^"]+)(")/g,
              "$1[REDACTED]$3"
            );
            try {
              return JSON.parse(sanitized);
            } catch (e) {
              return sanitized;
            }
          }
        }
        return arg;
      });

      // Log the sanitized version
      originalConsoleLog.apply(console, sanitizedArgs);
    } else {
      // Not a Twilio token log, proceed normally
      originalConsoleLog.apply(console, args);
    }
  };

  // Also override console.info which Twilio might use
  console.info = function (...args) {
    // Apply same filtering logic
    const firstArg = args[0]?.toString() || "";
    if (
      (typeof firstArg === "string" &&
        firstArg.includes("[TwilioVoice]") &&
        (args.some((arg) => typeof arg === "string" && arg.includes("token")) ||
          JSON.stringify(args).includes("token"))) ||
      args.some(
        (arg) =>
          typeof arg === "object" &&
          arg !== null &&
          JSON.stringify(arg).includes('token":')
      )
    ) {
      const sanitizedArgs = args.map((arg) => {
        if (typeof arg === "string") {
          return arg.replace(/("token":")([^"]+)(")/g, "$1[REDACTED]$3");
        } else if (typeof arg === "object" && arg !== null) {
          const stringified = JSON.stringify(arg);
          if (stringified.includes("token")) {
            const sanitized = stringified.replace(
              /("token":")([^"]+)(")/g,
              "$1[REDACTED]$3"
            );
            try {
              return JSON.parse(sanitized);
            } catch (e) {
              return sanitized;
            }
          }
        }
        return arg;
      });

      originalConsoleInfo.apply(console, sanitizedArgs);
    } else {
      originalConsoleInfo.apply(console, args);
    }
  };

  // Execute the callback
  return callback().finally(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.info = originalConsoleInfo;
  });
};

// Call status states
export enum CallStatus {
  IDLE = "idle",
  INITIALIZING = "initializing",
  READY = "ready",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  DISCONNECTING = "disconnecting",
  ERROR = "error",
}

// Call quality levels
export enum CallQuality {
  UNKNOWN = "unknown",
  POOR = "poor",
  FAIR = "fair",
  GOOD = "good",
  EXCELLENT = "excellent",
}

// Updated interface with enhanced typing
interface TwilioContextType {
  status: CallStatus;
  isReady: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  makeCall: (phoneNumber: string) => Promise<boolean>;
  hangUp: () => void;
  error: string | null;
  errorDetails: Record<string, any> | null;
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
  // Add deviceDebugInfo as an alias to debugInfo for backward compatibility
  deviceDebugInfo: {
    lastAction: string;
    timestamp: number;
    deviceState: string | null;
    error: string | null;
  };
  connection: any;
  callDuration: number;
  estimatedCost: number;
  insufficientCredits: boolean;
  checkCredits: (durationMinutes: number) => Promise<boolean>;
  isMuted: boolean;
  toggleMute: () => void;
  callQuality: CallQuality;
  retryConnection: () => Promise<boolean>;
  callTo: string | null;
  callStartTime: Date | null;
  resetError: () => void;
  // Trial mode properties
  isTrialMode: boolean;
  trialCallsRemaining: number;
  setTrialCallsRemaining: React.Dispatch<React.SetStateAction<number>>;
  trialTimeRemaining: number; // in seconds
  initializeTrialMode: () => Promise<boolean>;
  showTrialConversionModal: boolean;
  setShowTrialConversionModal: (show: boolean) => void;
}

const TwilioContext = createContext<TwilioContextType | undefined>(undefined);

// Unregister any existing service worker first to fix any issues
if (typeof window !== "undefined") {
  // Immediately unregister any existing service worker to fix current issues
  (async () => {
    try {
      const unregistered = await unregisterTokenFilter();
      if (unregistered) {
        console.log("Successfully unregistered problematic service worker");
        // Wait a moment before registering the new one
        setTimeout(() => {
          registerTokenFilterServiceWorker();
        }, 1000);
      } else {
        // If no service worker was unregistered, register the new one directly
        registerTokenFilterServiceWorker();
      }
    } catch (error) {
      console.error("Error handling service worker:", error);
    }
  })();
}

export function TwilioProvider({ children }: { children: React.ReactNode }) {
  // Basic call state
  const [status, setStatus] = useState<CallStatus>(CallStatus.IDLE);
  const [isReady, setIsReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<Record<string, any> | null>(
    null
  );
  const [activeCall, setActiveCall] = useState<any>(null);
  const { user, loading: authLoading } = useAuth();
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);

  // Call tracking state
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [currentRate, setCurrentRate] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [callTo, setCallTo] = useState<string | null>(null);

  // Trial mode state
  const [isTrialMode, setIsTrialMode] = useState(false);
  const [trialCallsRemaining, setTrialCallsRemaining] = useState(0);
  const [trialTimeRemaining, setTrialTimeRemaining] = useState(60); // 60 seconds
  const [showTrialConversionModal, setShowTrialConversionModal] =
    useState(false);
  const trialTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Duration tracking interval
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // API URL for local development or production
  const apiUrl =
    typeof window !== "undefined" && window.location.hostname === "localhost"
      ? `${window.location.protocol}//${window.location.hostname}:3000`
      : window.location.origin;

  // Call information
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
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callQuality, setCallQuality] = useState<CallQuality>(
    CallQuality.UNKNOWN
  );

  // Add necessary refs for tracking
  const qualityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const reconnectAttempts = useRef<number>(0);

  // Device state
  const [device, setDevice] = useState<Device | null>(null);

  // Add token rotation state
  const tokenRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [tokenExpirationTime, setTokenExpirationTime] = useState<Date | null>(
    null
  );

  // Function to update debug info
  const updateDebugInfo = useCallback(
    (
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
    },
    []
  );

  // Reset error state
  const resetError = useCallback(() => {
    setError(null);
    setErrorDetails(null);
    setInsufficientCredits(false);
  }, []);

  // Function to start tracking call duration and cost
  const startCallTracking = useCallback(
    (rate: number) => {
      setCallStartTime(new Date());
      setCurrentRate(rate);

      // Clear any existing interval
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      // Start a new interval to update duration and cost every second
      durationIntervalRef.current = setInterval(() => {
        if (callStartTime) {
          const duration = Math.ceil(
            (Date.now() - callStartTime.getTime()) / 1000
          );
          setCallDuration(duration);
          // Calculate cost: rate per minute * minutes (convert seconds to minutes)
          const cost = (rate * duration) / 60;
          setEstimatedCost(parseFloat(cost.toFixed(2)));
        }
      }, 1000);
    },
    [callStartTime]
  );

  // Function to stop tracking call duration and cost
  const stopCallTracking = useCallback(async () => {
    // Clear the duration tracking interval
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // Record the call in the database if it was a valid call
    if (callStartTime && callDuration > 0 && activeCall?.parameters?.CallSid) {
      try {
        console.log("Recording call usage:", {
          duration: callDuration,
          cost: estimatedCost,
          callSid: activeCall.parameters.CallSid,
        });

        // Get the current session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          console.error("No session found for call recording");
          return;
        }

        // Record the call in the database
        const { error } = await supabase.from("call_logs").insert({
          user_id: session.user.id,
          call_sid: activeCall.parameters.CallSid,
          duration: callDuration,
          cost: estimatedCost,
          phone_number: callTo || "",
          direction: "outbound",
          status: "completed",
        });

        if (error) {
          console.error("Error recording call:", error);
        }

        // Deduct credits from the user's account
        if (estimatedCost > 0) {
          const { error: creditError } = await supabase.rpc("deduct_credits", {
            user_id: session.user.id,
            amount: estimatedCost,
          });

          if (creditError) {
            console.error("Error deducting credits:", creditError);
          }
        }
      } catch (error) {
        console.error("Error in stopCallTracking:", error);
      }
    }

    // Reset call tracking state
    setCallStartTime(null);
    setCallDuration(0);
    setEstimatedCost(0);
    setCurrentRate(0);
  }, [callStartTime, callDuration, estimatedCost, activeCall, callTo]);

  // Function to hang up the call
  const hangUp = () => {
    try {
      console.log(
        "Hanging up call, activeCall:",
        !!activeCall,
        "device:",
        !!device
      );

      if (activeCall) {
        console.log("Hanging up active call");
        activeCall.disconnect();
      } else if (device) {
        console.log("No active call, disconnecting all calls");
        device.disconnectAll();
      }

      // Clean up the audio stream
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }

      // Ensure state is updated even if disconnect events don't fire
      setActiveCall(null);
      setConnection(null);
      setIsConnected(false);
      setStatus(CallStatus.READY);

      // Update debug info
      setDebugInfo({
        lastAction: "hang_up",
        timestamp: Date.now(),
        status: status,
        error: null,
      });
    } catch (error: any) {
      console.error("Error hanging up call:", error);
      setError(`Error hanging up: ${error.message}`);
    }
  };

  // Function to start tracking trial call duration
  const startTrialCallTracking = useCallback(
    (rate: number) => {
      setCallStartTime(new Date());
      setCurrentRate(rate);
      setTrialTimeRemaining(60); // Reset to 60 seconds

      // Clear any existing interval
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      // Clear any existing trial timer
      if (trialTimerRef.current) {
        clearTimeout(trialTimerRef.current);
      }

      // Start a new interval to update duration and remaining time
      durationIntervalRef.current = setInterval(() => {
        if (callStartTime) {
          const duration = Math.ceil(
            (Date.now() - callStartTime.getTime()) / 1000
          );
          setCallDuration(duration);

          // Update trial time remaining
          const remaining = Math.max(0, 60 - duration);
          setTrialTimeRemaining(remaining);

          // Calculate cost for display only (not charged in trial)
          const cost = (rate * duration) / 60;
          setEstimatedCost(parseFloat(cost.toFixed(2)));

          // Auto-end call when trial time expires
          if (remaining === 0 && isConnected) {
            console.log("Trial time expired, ending call");
            hangUp();
            setShowTrialConversionModal(true);
          }
        }
      }, 1000);

      // Set a backup timer to ensure call ends after 60 seconds
      trialTimerRef.current = setTimeout(() => {
        if (isConnected) {
          console.log("Trial time backup timer triggered, ending call");
          hangUp();
          setShowTrialConversionModal(true);
        }
      }, 61000); // 61 seconds as a safety margin
    },
    [callStartTime, isConnected]
  );

  // Function to stop tracking trial call duration
  const stopTrialCallTracking = useCallback(async () => {
    console.log("[TRIAL FLOW] stopTrialCallTracking - Starting");

    // Clear the duration tracking interval
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // Clear the trial timer
    if (trialTimerRef.current) {
      clearTimeout(trialTimerRef.current);
      trialTimerRef.current = null;
    }

    // Record trial usage
    if (callStartTime && callDuration > 0 && activeCall?.parameters?.CallSid) {
      try {
        console.log(
          "[TRIAL FLOW] stopTrialCallTracking - Recording trial usage:",
          {
            duration: callDuration,
            callSid: activeCall.parameters.CallSid,
          }
        );

        // Get device fingerprint and IP address
        const fingerprint = localStorage.getItem("zkypee_trial_fingerprint");
        const ipAddress = localStorage.getItem("zkypee_trial_ip_address");

        console.log("[TRIAL FLOW] stopTrialCallTracking - Identifiers:", {
          fingerprint: fingerprint?.substring(0, 8) + "...",
          ipAddress,
        });

        if (!fingerprint || !ipAddress) {
          console.error(
            "[TRIAL FLOW] stopTrialCallTracking - Missing trial identification"
          );
          throw new Error("Missing trial identification");
        }

        // Import the recordTrialUsage function
        const { recordTrialUsage } = await import("@/lib/trial-limitations");

        // Record usage in Supabase with both IP and fingerprint
        console.log(
          "[TRIAL FLOW] stopTrialCallTracking - Calling recordTrialUsage"
        );
        await recordTrialUsage(
          ipAddress as string,
          fingerprint as string,
          activeCall.parameters.CallSid,
          callDuration,
          callTo || undefined
        );
        console.log(
          "[TRIAL FLOW] stopTrialCallTracking - recordTrialUsage completed"
        );

        // Directly check the database to verify the record was created/updated
        await verifyTrialRecordInDatabase(
          ipAddress as string,
          fingerprint as string
        );

        // Track trial call completion in analytics
        await trackTrialComplete(
          fingerprint,
          callDuration,
          activeCall.parameters.CallSid,
          callTo || undefined
        );

        // Track general call metrics with trial flag
        await trackCallMetrics(
          null, // No user ID for trial calls
          activeCall.parameters.CallSid,
          callDuration,
          0, // No cost for trial calls
          callQuality.toString(),
          true // This is a trial call
        );

        // Update remaining calls based on the response from recordTrialUsage
        const { getTrialUsage } = await import("@/lib/trial-limitations");
        console.log(
          "[TRIAL FLOW] stopTrialCallTracking - Calling getTrialUsage"
        );
        const usage = await getTrialUsage(ipAddress, fingerprint);
        console.log(
          "[TRIAL FLOW] stopTrialCallTracking - getTrialUsage result:",
          usage
        );

        const oldRemaining = trialCallsRemaining;
        setTrialCallsRemaining(usage.callsRemaining);
        console.log(
          "[TRIAL FLOW] stopTrialCallTracking - Updated trial calls remaining:",
          {
            old: oldRemaining,
            new: usage.callsRemaining,
            changed: oldRemaining !== usage.callsRemaining,
          }
        );

        // If no calls remaining, show the conversion modal
        if (usage.callsRemaining <= 0) {
          console.log(
            "[TRIAL FLOW] stopTrialCallTracking - No calls remaining, showing conversion modal"
          );
          setShowTrialConversionModal(true);
        }
      } catch (error) {
        console.error(
          "[TRIAL FLOW] stopTrialCallTracking - Error recording trial usage:",
          error
        );

        // Track the error
        const fingerprint = localStorage.getItem("zkypee_trial_fingerprint");
        if (fingerprint) {
          await trackTrialError(
            fingerprint,
            error instanceof Error
              ? error.message
              : "Unknown error recording trial usage",
            activeCall.parameters.CallSid
          );
        }
      }
    } else {
      console.log("[TRIAL FLOW] stopTrialCallTracking - No call to record:", {
        hasCallStartTime: !!callStartTime,
        callDuration,
        hasCallSid: !!activeCall?.parameters?.CallSid,
      });
    }

    // Reset call tracking state
    setCallStartTime(null);
    setCallDuration(0);
    setEstimatedCost(0);
    setCurrentRate(0);
    console.log("[TRIAL FLOW] stopTrialCallTracking - Completed");
  }, [
    callStartTime,
    callDuration,
    activeCall,
    callTo,
    callQuality,
    trialCallsRemaining,
  ]);

  // Helper function to verify trial record in database
  const verifyTrialRecordInDatabase = async (
    ipAddress: string,
    fingerprint: string
  ) => {
    try {
      console.log(
        "[TRIAL FLOW] verifyTrialRecordInDatabase - Checking database for record"
      );

      // Import the supabase client and admin client
      const { supabase, supabaseAdmin } = await import("@/lib/supabase");

      // Check for record by IP
      const { data: ipData, error: ipError } = await supabaseAdmin
        .from("trial_calls")
        .select("*")
        .filter("ip_address", "eq", ipAddress)
        .maybeSingle();

      console.log(
        "[TRIAL FLOW] verifyTrialRecordInDatabase - IP query result:",
        {
          found: !!ipData,
          data: ipData
            ? {
                ip_address: ipData.ip_address,
                count: ipData.count,
                last_call_at: ipData.last_call_at,
                fingerprint: ipData.device_fingerprint?.substring(0, 8) + "...",
              }
            : null,
          error: ipError
            ? {
                code: ipError.code,
                message: ipError.message,
              }
            : null,
        }
      );

      // Check for record by fingerprint
      const { data: fingerprintData, error: fingerprintError } =
        await supabaseAdmin
          .from("trial_calls")
          .select("*")
          .eq("device_fingerprint", fingerprint)
          .maybeSingle();

      console.log(
        "[TRIAL FLOW] verifyTrialRecordInDatabase - Fingerprint query result:",
        {
          found: !!fingerprintData,
          data: fingerprintData
            ? {
                ip_address: fingerprintData.ip_address,
                count: fingerprintData.count,
                last_call_at: fingerprintData.last_call_at,
                fingerprint:
                  fingerprintData.device_fingerprint?.substring(0, 8) + "...",
              }
            : null,
          error: fingerprintError
            ? {
                code: fingerprintError.code,
                message: fingerprintError.message,
              }
            : null,
        }
      );

      // Get all records for debugging
      const { data: allRecords, error: allRecordsError } = await supabaseAdmin
        .from("trial_calls")
        .select("*")
        .order("last_call_at", { ascending: false })
        .limit(5);

      console.log(
        "[TRIAL FLOW] verifyTrialRecordInDatabase - Recent records:",
        {
          count: allRecords?.length || 0,
          records:
            allRecords?.map((r) => ({
              ip_address: r.ip_address,
              count: r.count,
              last_call_at: r.last_call_at,
              fingerprint: r.device_fingerprint?.substring(0, 8) + "...",
            })) || [],
          error: allRecordsError
            ? {
                code: allRecordsError.code,
                message: allRecordsError.message,
              }
            : null,
        }
      );
    } catch (error) {
      console.error("[TRIAL FLOW] verifyTrialRecordInDatabase - Error:", error);
    }
  };

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      // Clear any active intervals
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      if (qualityCheckIntervalRef.current) {
        clearInterval(qualityCheckIntervalRef.current);
        qualityCheckIntervalRef.current = null;
      }

      // Clean up the audio stream
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }

      // Destroy device only on unmount
      if (device) {
        device.destroy();
      }
    };
  }, []); // Empty dependency array means this only runs on unmount

  // Initialize device when user auth state changes
  useEffect(() => {
    if (user && !authLoading && status === CallStatus.IDLE && !device) {
      console.log("User authenticated, initializing Twilio device");
      initializeDevice();
    }
  }, [user, authLoading, status]);

  // Function to fetch a new Twilio token
  const fetchTwilioToken = async (): Promise<string | null> => {
    try {
      console.log("Fetching new Twilio token");

      // Get the current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error("No session found for token refresh");
        return null;
      }

      const response = await fetch(`${apiUrl}/api/twilio/token`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        console.error("Failed to get new Twilio token");
        return null;
      }

      const data = await response.json();
      if (!data.token) {
        console.error("No token received in response");
        return null;
      }

      // Calculate token expiration time (default to 1 hour if not provided)
      const expiresIn = data.ttl || 3600; // seconds
      const newExpirationTime = new Date(Date.now() + expiresIn * 1000);
      setTokenExpirationTime(newExpirationTime);

      console.log(`Token refreshed, expires in ${expiresIn} seconds`);
      return data.token;
    } catch (err) {
      console.error("Error fetching Twilio token:", err);
      return null;
    }
  };

  // Function to fetch a trial Twilio token
  const fetchTrialToken = async (): Promise<{
    token: string | null;
    fingerprint: string | null;
    ipAddress: string | null;
    trialAvailable: boolean;
    callsUsed: number;
  }> => {
    try {
      console.log("[TRIAL FLOW] fetchTrialToken - Starting token fetch");

      const response = await fetch(`${apiUrl}/api/twilio/trial-token`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        console.error(
          "[TRIAL FLOW] fetchTrialToken - Failed to get trial token",
          response.status,
          response.statusText
        );
        return {
          token: null,
          fingerprint: null,
          ipAddress: null,
          trialAvailable: false,
          callsUsed: 0,
        };
      }

      const data = await response.json();
      if (!data.token) {
        console.error(
          "[TRIAL FLOW] fetchTrialToken - No token received in response",
          data
        );
        return {
          token: null,
          fingerprint: null,
          ipAddress: null,
          trialAvailable: false,
          callsUsed: 0,
        };
      }

      console.log("[TRIAL FLOW] fetchTrialToken - Response data:", {
        fingerprint: data.fingerprint?.substring(0, 8) + "...",
        ipAddress: data.ipAddress,
        trialCallsUsed: data.trialCallsUsed,
        trialCallsRemaining: data.trialCallsRemaining,
        debug: data.debug,
      });

      // Store the fingerprint and IP address in localStorage
      if (data.fingerprint) {
        const oldFingerprint = localStorage.getItem("zkypee_trial_fingerprint");
        localStorage.setItem("zkypee_trial_fingerprint", data.fingerprint);
        console.log("[TRIAL FLOW] fetchTrialToken - Stored fingerprint:", {
          old: oldFingerprint?.substring(0, 8) + "...",
          new: data.fingerprint.substring(0, 8) + "...",
          changed: oldFingerprint !== data.fingerprint,
        });
      }

      if (data.ipAddress) {
        const oldIpAddress = localStorage.getItem("zkypee_trial_ip_address");
        localStorage.setItem("zkypee_trial_ip_address", data.ipAddress);
        console.log("[TRIAL FLOW] fetchTrialToken - Stored IP address:", {
          old: oldIpAddress,
          new: data.ipAddress,
          changed: oldIpAddress !== data.ipAddress,
        });
      }

      // Set trial calls remaining from the response
      if (typeof data.trialCallsRemaining === "number") {
        const oldRemaining = trialCallsRemaining;
        setTrialCallsRemaining(data.trialCallsRemaining);
        console.log(
          "[TRIAL FLOW] fetchTrialToken - Set trial calls remaining:",
          {
            old: oldRemaining,
            new: data.trialCallsRemaining,
            changed: oldRemaining !== data.trialCallsRemaining,
          }
        );
      }

      // Calculate token expiration time (default to 5 minutes if not provided)
      const expiresIn = data.ttl || 300; // seconds
      const newExpirationTime = new Date(Date.now() + expiresIn * 1000);
      setTokenExpirationTime(newExpirationTime);

      console.log(
        `[TRIAL FLOW] fetchTrialToken - Token fetched successfully, expires in ${expiresIn} seconds`
      );

      return {
        token: data.token,
        fingerprint: data.fingerprint || null,
        ipAddress: data.ipAddress || null,
        trialAvailable: true,
        callsUsed: data.trialCallsUsed || 0,
      };
    } catch (err) {
      console.error("[TRIAL FLOW] fetchTrialToken - Error:", err);
      return {
        token: null,
        fingerprint: null,
        ipAddress: null,
        trialAvailable: false,
        callsUsed: 0,
      };
    }
  };

  // Function to schedule the next token refresh
  const scheduleTokenRefresh = useCallback(() => {
    // Clear any existing timer
    if (tokenRefreshTimerRef.current) {
      clearTimeout(tokenRefreshTimerRef.current);
      tokenRefreshTimerRef.current = null;
    }

    // If we don't have an expiration time, use the default interval
    if (!tokenExpirationTime) {
      tokenRefreshTimerRef.current = setTimeout(
        refreshToken,
        TOKEN_REFRESH_INTERVAL
      );
      return;
    }

    // Calculate time until expiration minus buffer
    const now = new Date();
    const timeUntilExpiration = tokenExpirationTime.getTime() - now.getTime();
    const refreshTime = Math.max(timeUntilExpiration - TOKEN_REFRESH_BUFFER, 0);

    // If token is already expired or about to expire, refresh immediately
    if (refreshTime < 1000) {
      refreshToken();
      return;
    }

    // Schedule the refresh
    console.log(
      `Scheduling token refresh in ${Math.floor(refreshTime / 1000)} seconds`
    );
    tokenRefreshTimerRef.current = setTimeout(refreshToken, refreshTime);
  }, [tokenExpirationTime]);

  // Function to refresh the token and update the device
  const refreshToken = useCallback(async () => {
    // Only refresh if we have a device and it's ready
    if (!device || !isReady) {
      console.log("Device not ready, skipping token refresh");
      return;
    }

    try {
      // Get a new token
      const newToken = await fetchTwilioToken();
      if (!newToken) {
        console.error("Failed to get new token for refresh");
        return;
      }

      // Update the device with the new token
      await suppressTwilioTokenLogs(async () => {
        console.log("Updating device with new token");
        await device.updateToken(newToken);
        console.log("Device token updated successfully");

        // Schedule the next refresh
        scheduleTokenRefresh();
      });
    } catch (err) {
      console.error("Error refreshing token:", err);
    }
  }, [device, isReady, scheduleTokenRefresh]);

  // Set up token rotation when device is initialized
  useEffect(() => {
    if (device && isReady && !tokenRefreshTimerRef.current) {
      console.log("Setting up token rotation for Twilio device");
      scheduleTokenRefresh();
    }

    return () => {
      // Clean up timer on unmount
      if (tokenRefreshTimerRef.current) {
        clearTimeout(tokenRefreshTimerRef.current);
        tokenRefreshTimerRef.current = null;
      }
    };
  }, [device, isReady, scheduleTokenRefresh]);

  // Initialize the Twilio device
  const initializeDevice = async (): Promise<boolean> => {
    try {
      resetError();
      setStatus(CallStatus.INITIALIZING);
      updateDebugInfo("initialize_device", "starting", null);

      // Check if device already exists and is ready
      if (device && isReady) {
        return true;
      }

      // Check if user is authenticated
      if (!user) {
        setError("Authentication required to initialize device");
        setStatus(CallStatus.ERROR);
        updateDebugInfo("initialize_device", "failed", "No authenticated user");
        return false;
      }

      // Get the current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setError("Authentication required to initialize device");
        setStatus(CallStatus.ERROR);
        updateDebugInfo("initialize_device", "failed", "No session found");
        return false;
      }

      // Fetch a Twilio token
      const token = await fetchTwilioToken();
      if (!token) {
        setError("Failed to get Twilio token");
        setStatus(CallStatus.ERROR);
        return false;
      }

      // Use the suppressTwilioTokenLogs helper to hide token information in logs
      return await suppressTwilioTokenLogs(async () => {
        // Create new device
        const newDevice = new Device(token, {
          logLevel: "debug",
          allowIncomingWhileBusy: true,
          closeProtection: true,
          codecPreferences: ["pcmu", "opus"] as any, // Type assertion for now
        });

        // Set up event handlers
        newDevice.on("registered", () => {
          console.log("✅ Twilio device is ready");
          setStatus(CallStatus.READY);
          setIsReady(true);
          setIsConnecting(false);

          // Set up token rotation
          scheduleTokenRefresh();
        });

        newDevice.on("error", (error: Error) => {
          console.error("❌ Twilio device error:", error);
          setError(error.message);
          setStatus(CallStatus.ERROR);
          setIsConnecting(false);
        });

        newDevice.on("connect", (call: Call) => {
          console.log("📞 Call connected in device.on('connect') handler", {
            callSid: call.parameters.CallSid,
            status: call.status(),
          });

          setActiveCall(call);
          setConnection(call);
          setIsConnected(true);
          setStatus(CallStatus.CONNECTED);
          setCallStartTime(new Date());

          // Set up call event handlers
          call.on("mute", (isMuted: boolean) => {
            console.log("Call mute event from device connect:", isMuted);
            setIsMuted(isMuted);
          });

          // Handle disconnect
          call.on("disconnect", () => {
            console.log("📞 Call disconnected in device.on('connect') handler");
            setActiveCall(null);
            setConnection(null);
            setIsConnected(false);
            setStatus(CallStatus.READY);
            setIsMuted(false);
            setCallStartTime(null);
          });

          // Monitor call status
          call.on("warning", (warning: string) => {
            console.warn("Call warning:", warning);
          });

          call.on("warning-cleared", (warning: string) => {
            console.log("Call warning cleared:", warning);
          });
        });

        newDevice.on("disconnect", () => {
          console.log("📞 Device disconnected");
          setIsConnected(false);
          setActiveCall(null);
          setConnection(null);
          setStatus(CallStatus.READY);
          setIsMuted(false);
          setCallStartTime(null);
        });

        // Register the device
        await newDevice.register();

        setDevice(newDevice);
        return true;
      });
    } catch (err: any) {
      console.error("Error initializing device:", err);
      setError(err.message);
      setStatus(CallStatus.ERROR);
      return false;
    }
  };

  // Function to request microphone permissions
  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      console.log("Requesting microphone permission...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Store the stream in a ref for later use
      audioStreamRef.current = stream;

      // Log the audio tracks for debugging
      const audioTracks = stream.getAudioTracks();
      console.log(
        `Got ${audioTracks.length} audio tracks:`,
        audioTracks.map((track) => ({
          id: track.id,
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
        }))
      );

      console.log("Microphone permission granted");
      return true;
    } catch (err) {
      console.error("Error getting microphone permission:", err);
      setError(
        "Microphone access is required to make calls. Please allow microphone access and try again."
      );
      setStatus(CallStatus.ERROR);
      return false;
    }
  };

  // Function to make a call
  const makeCall = async (phoneNumber: string): Promise<boolean> => {
    try {
      resetError();

      if (isTrialMode) {
        // Get current trial fingerprint and IP address from localStorage
        const fingerprint = localStorage.getItem("zkypee_trial_fingerprint");
        const ipAddress = localStorage.getItem("zkypee_trial_ip_address");

        if (fingerprint && ipAddress) {
          // Fetch current trial usage directly from the API endpoint to ensure we have the latest data
          console.log(
            "[TRIAL FLOW] makeCall - Fetching current trial usage from API"
          );
          const response = await fetch(
            `/api/trial/get-usage?fingerprint=${encodeURIComponent(
              fingerprint
            )}&ipAddress=${encodeURIComponent(ipAddress)}`
          );

          if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
          }

          const usage = await response.json();
          console.log(
            "[TRIAL FLOW] makeCall - Current trial usage from API:",
            usage
          );

          // Update trial calls remaining based on the database
          setTrialCallsRemaining(usage.callsRemaining);
          console.log(
            "[TRIAL FLOW] makeCall - Updated trial calls remaining to:",
            usage.callsRemaining
          );

          // Check if user has any trial calls remaining based on the database
          if (usage.callsRemaining <= 0) {
            console.log(
              "[TRIAL FLOW] makeCall - No calls remaining, showing conversion modal"
            );
            setError("Trial calls limit reached. Please sign up to continue.");
            setShowTrialConversionModal(true);
            return false;
          }
        } else {
          // When fingerprint or IP isn't available, attempt to get new ones
          console.log(
            "[TRIAL FLOW] makeCall - Missing trial identification, attempting to initialize trial mode"
          );

          // Initialize trial mode to get new fingerprint and IP
          const initialized = await initializeTrialMode();
          if (!initialized) {
            console.error(
              "[TRIAL FLOW] makeCall - Failed to initialize trial mode"
            );
            setError("Failed to verify trial status. Please try again.");
            return false;
          }

          // After initialization, check trial calls remaining based on what we retrieved from DB
          if (trialCallsRemaining <= 0) {
            console.log(
              "[TRIAL FLOW] makeCall - No calls remaining after initialization"
            );
            setError("Trial calls limit reached. Please sign up to continue.");
            setShowTrialConversionModal(true);
            return false;
          }
        }
      } else {
        // Regular call - check credits
        const hasEnoughCredits = await checkCredits(1); // Check for at least 1 minute
        if (!hasEnoughCredits) return false;
      }

      if (!device || !isReady) {
        const initialized = isTrialMode
          ? await initializeTrialMode()
          : await initializeDevice();
        if (!initialized) return false;
      }

      // Get rate information before making the call
      const response = await fetch(
        `/api/rates/lookup?number=${encodeURIComponent(phoneNumber)}`
      );
      const rateInfo = await response.json();
      const rate = rateInfo.rate || COST_PER_MINUTE;

      setIsConnecting(true);
      setStatus(CallStatus.CONNECTING);
      setCallTo(phoneNumber);

      // Make the call with token suppression
      return await suppressTwilioTokenLogs(async () => {
        // Make the call
        if (!device) {
          throw new Error("Device not initialized");
        }

        const call = await device.connect({
          params: { To: phoneNumber },
        });

        // Store call reference
        setActiveCall(call);

        // Set up call event handlers
        call.on("accept", () => {
          console.log("Call accepted");
          setIsConnected(true);
          setStatus(CallStatus.CONNECTED);

          if (isTrialMode) {
            // Start trial timer
            startTrialCallTracking(rate);

            // Remove manual decrement and instead rely on database
            console.log("[TRIAL FLOW] Call accepted - Recording trial usage");

            // Record the trial usage immediately when the call is accepted
            const recordTrialUsageOnAccept = async () => {
              try {
                const fingerprint = localStorage.getItem(
                  "zkypee_trial_fingerprint"
                );
                const ipAddress = localStorage.getItem(
                  "zkypee_trial_ip_address"
                );

                if (!fingerprint || !ipAddress) {
                  console.error(
                    "[TRIAL FLOW] Missing trial identification on call accept"
                  );
                  return;
                }

                // Import the recordTrialUsage function
                const { recordTrialUsage } = await import(
                  "@/lib/trial-limitations"
                );

                // Record usage in Supabase with both IP and fingerprint
                console.log(
                  "[TRIAL FLOW] Call accepted - Recording trial usage"
                );
                if (fingerprint && ipAddress && call.parameters.CallSid) {
                  const ipAddressStr: string = ipAddress;
                  const fingerprintStr: string = fingerprint;

                  await recordTrialUsage(
                    ipAddressStr,
                    fingerprintStr,
                    call.parameters.CallSid,
                    1, // Minimum duration of 1 second
                    phoneNumber
                  );

                  // Get updated trial usage directly from API
                  console.log(
                    "[TRIAL FLOW] Call accepted - Fetching updated trial usage from API"
                  );
                  const response = await fetch(
                    `/api/trial/get-usage?fingerprint=${encodeURIComponent(
                      fingerprintStr
                    )}&ipAddress=${encodeURIComponent(ipAddressStr)}`
                  );

                  if (!response.ok) {
                    throw new Error(`API request failed: ${response.status}`);
                  }

                  const usage = await response.json();
                  console.log(
                    "[TRIAL FLOW] Call accepted - Updated trial usage from API:",
                    usage
                  );

                  // Update UI with latest database value
                  setTrialCallsRemaining(usage.callsRemaining);
                  console.log(
                    "[TRIAL FLOW] Call accepted - Updated trial calls remaining to:",
                    usage.callsRemaining
                  );

                  // Verify the record was created/updated
                  await verifyTrialRecordInDatabase(
                    ipAddressStr,
                    fingerprintStr
                  );
                } else {
                  console.error(
                    "[TRIAL FLOW] Missing fingerprint, ipAddress, or CallSid for recordTrialUsage"
                  );
                }
              } catch (error) {
                console.error(
                  "[TRIAL FLOW] Error recording trial usage on call accept:",
                  error
                );
              }
            };

            // Execute the async function
            recordTrialUsageOnAccept();
          } else {
            // Regular call tracking
            startCallTracking(rate);
          }
        });

        call.on("disconnect", () => {
          console.log("Call disconnected");
          setIsConnected(false);
          setStatus(CallStatus.READY);

          if (isTrialMode) {
            stopTrialCallTracking();
            // Don't decrement trial calls here since we already did it on accept
            // setTrialCallsRemaining((prev) => prev - 1);

            // Show conversion modal after trial call ends
            setShowTrialConversionModal(true);
          } else {
            stopCallTracking();
          }
        });

        return true;
      });
    } catch (err) {
      console.error("Error making call:", err);
      setError(err instanceof Error ? err.message : "Failed to make call");
      setStatus(CallStatus.ERROR);
      setIsConnecting(false);
      return false;
    }
  };

  // Check if user has enough credits for a call
  const checkCredits = async (durationMinutes: number): Promise<boolean> => {
    try {
      resetError();

      if (!user) {
        setError("Authentication required to check credits");
        return false;
      }

      // First, get the credit balance directly from Supabase
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("credit_balance")
        .eq("id", user.id)
        .maybeSingle();

      if (userError) {
        console.error(
          "Error fetching credit balance from Supabase:",
          userError
        );
        setError(`Failed to fetch credit balance: ${userError.message}`);
        return false;
      }

      const creditBalance = userData?.credit_balance ?? 0;
      console.log(
        `[checkCredits] User credit balance from Supabase: ${creditBalance}`
      );

      // Then get the rate information from the API
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError("Authentication required to check credits");
        return false;
      }

      const response = await fetch(
        `/api/credits/check?phoneNumber=${encodeURIComponent(
          callTo || "default"
        )}&duration=${durationMinutes}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to check credit balance");
        return false;
      }

      const data = await response.json();
      console.log(`[checkCredits] API response:`, data);

      // Calculate required credits using the rate from the API
      const requiredCredits = data.ratePerMinute * durationMinutes;
      console.log(
        `[checkCredits] Required credits: ${requiredCredits} for ${durationMinutes} minutes at rate ${data.ratePerMinute}/min`
      );

      // Check if user has enough credits based on Supabase balance
      const hasEnoughCredits = creditBalance >= requiredCredits;
      console.log(
        `[checkCredits] Has enough credits: ${hasEnoughCredits} (${creditBalance} >= ${requiredCredits})`
      );

      if (!hasEnoughCredits) {
        setError("Insufficient credits for this call");
        setInsufficientCredits(true);
        return false;
      }

      return true;
    } catch (err: any) {
      console.error("Error checking credits:", err);
      setError(err.message || "Error checking credit balance");
      return false;
    }
  };

  // Toggle mute state
  const toggleMute = () => {
    console.log("Toggle mute called - Current state:", {
      hasActiveCall: !!activeCall,
      hasConnection: !!connection,
      hasDevice: !!device,
      isConnected,
      isMuted,
      hasAudioStream: !!audioStreamRef.current,
      deviceState: device?.state,
      connectionState: connection?.state,
      callStatus: activeCall?.status(),
      callSid: activeCall?.parameters?.CallSid,
    });

    // Try to get the active call object
    let callToMute = activeCall || connection;

    if (!callToMute && !isConnected) {
      console.error("No active call found to mute/unmute");
      return;
    }

    try {
      const newMuteState = !isMuted;
      console.log("Attempting to mute call:", {
        newMuteState,
        callSid: callToMute?.parameters?.CallSid,
        callStatus: callToMute?.status(),
      });

      // IMPORTANT: Update the state immediately for UI feedback
      setIsMuted(newMuteState);

      // Method 1: Directly manipulate audio tracks - THIS IS THE MOST RELIABLE METHOD
      if (audioStreamRef.current) {
        const audioTracks = audioStreamRef.current.getAudioTracks();
        console.log(`Found ${audioTracks.length} audio tracks to mute`);

        audioTracks.forEach((track: MediaStreamTrack) => {
          // Disable the track directly
          track.enabled = !newMuteState;
          console.log(`Audio track ${track.id} enabled: ${!newMuteState}`);
        });
      } else {
        // If we don't have the audio stream reference, try to get it
        console.log(
          "No audio stream reference, attempting to get microphone access"
        );
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => {
            audioStreamRef.current = stream;
            const audioTracks = stream.getAudioTracks();
            console.log(
              `Got new audio stream with ${audioTracks.length} tracks`
            );

            audioTracks.forEach((track: MediaStreamTrack) => {
              track.enabled = !newMuteState;
              console.log(
                `New audio track ${track.id} enabled: ${!newMuteState}`
              );
            });
          })
          .catch((err) => {
            console.error("Error getting microphone access:", err);
          });
      }

      // Method 2: Use Twilio's mute method as a backup
      if (callToMute) {
        console.log("Calling mute on active call");
        try {
          callToMute.mute(newMuteState);
        } catch (err) {
          console.error("Error calling mute on Twilio call:", err);
        }

        // Ensure mute event handler is added
        if (!callToMute._muteEventAdded) {
          callToMute.on("mute", (muted: boolean) => {
            console.log("Mute event from Twilio:", muted);
            // Only update if different to avoid loops
            if (muted !== isMuted) {
              setIsMuted(muted);
            }
          });
          callToMute._muteEventAdded = true;
        }

        // Store the current mute state in a closure for the volume handler
        const currentMuteState = newMuteState;

        // Add volume monitoring to verify mute state
        callToMute.on("volume", (inputVolume: number) => {
          // Check against the captured mute state
          if (isMuted && inputVolume > 0) {
            console.warn(
              "Detected audio input while muted! Attempting to re-mute..."
            );
            // If we detect audio while muted, try to mute again
            if (audioStreamRef.current) {
              const audioTracks = audioStreamRef.current.getAudioTracks();
              audioTracks.forEach((track: MediaStreamTrack) => {
                track.enabled = false;
                console.log(`Re-muting audio track ${track.id}`);
              });
            }
          }
        });
      }

      // Method 3: Try to access the underlying MediaStream from the call object
      if (callToMute && typeof callToMute.getLocalStream === "function") {
        try {
          const localStream = callToMute.getLocalStream();
          if (localStream) {
            const callAudioTracks = localStream.getAudioTracks();
            console.log(
              `Found ${callAudioTracks.length} audio tracks from call's local stream`
            );

            callAudioTracks.forEach((track: MediaStreamTrack) => {
              track.enabled = !newMuteState;
              console.log(
                `Call audio track ${track.id} enabled: ${!newMuteState}`
              );
            });
          }
        } catch (err) {
          console.error("Error accessing call's local stream:", err);
        }
      }
    } catch (error) {
      console.error("Error toggling mute:", error);
      // Revert the local state if muting failed
      setIsMuted(isMuted);
    }
  };

  // Start monitoring call quality
  const startCallQualityMonitoring = () => {
    if (qualityCheckIntervalRef.current) {
      clearInterval(qualityCheckIntervalRef.current);
    }

    // Check quality every 5 seconds
    qualityCheckIntervalRef.current = setInterval(() => {
      // In a real implementation, this would check WebRTC stats
      // For this example, we'll simulate quality checks
      checkCallQuality();
    }, 5000);
  };

  // Simulate checking call quality
  const checkCallQuality = () => {
    if (!isConnected) return;

    // Get the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        console.error("No session found for quality check");
        return;
      }

      // Simulate quality check
      fetch(`${apiUrl}/api/twilio/call-quality`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        credentials: "include",
        mode: "cors",
        body: JSON.stringify({
          callSid: connection?.callSid,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to check call quality");
          }
          return response.json();
        })
        .then((data) => {
          if (data.quality) {
            setCallQuality(data.quality);
          }
        })
        .catch((err) => {
          console.warn("Error checking call quality:", err);
        });
    });
  };

  // Function to test the Twilio connection
  const testConnection = async () => {
    try {
      resetError();
      updateDebugInfo("test_connection", "starting", null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No session found for connection test");
      }

      const response = await fetch(`${apiUrl}/api/twilio/test`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        credentials: "include",
        mode: "cors",
      });

      const data = await response.json();

      if (!response.ok) {
        updateDebugInfo("test_connection", "failed", data.error);
        return {
          success: false,
          status: "error",
          isReady: isReady,
          apiResponse: data,
          error: data.error || "Unknown error",
        };
      }

      updateDebugInfo("test_connection", "success", null);
      return {
        success: true,
        status: "success",
        isReady: isReady,
        apiResponse: data,
        error: null,
      };
    } catch (err: any) {
      console.error("Error in testConnection:", err);
      updateDebugInfo("test_connection", "exception", err.message);
      return {
        success: false,
        status: "exception",
        isReady: isReady,
        apiResponse: null,
        error: err.message,
      };
    }
  };

  // Retry a failed connection
  const retryConnection = async (): Promise<boolean> => {
    resetError();

    if (reconnectAttempts.current >= 3) {
      setError(
        "Maximum reconnection attempts reached. Please try again later."
      );
      return false;
    }

    reconnectAttempts.current += 1;

    updateDebugInfo(
      "retry_connection",
      "attempt",
      `Attempt ${reconnectAttempts.current}/3`
    );

    return initializeDevice();
  };

  // Initialize trial mode
  const initializeTrialMode = useCallback(async (): Promise<boolean> => {
    console.log("[TRIAL FLOW] initializeTrialMode - Starting");

    try {
      // Check if we already have a trial token
      const existingToken = localStorage.getItem("zkypee_trial_token");
      const existingFingerprint = localStorage.getItem(
        "zkypee_trial_fingerprint"
      );
      const existingIpAddress = localStorage.getItem("zkypee_trial_ip_address");

      console.log("[TRIAL FLOW] initializeTrialMode - Existing data:", {
        hasToken: !!existingToken,
        hasFingerprint: !!existingFingerprint,
        hasIpAddress: !!existingIpAddress,
        fingerprint: existingFingerprint
          ? existingFingerprint.substring(0, 8) + "..."
          : null,
      });

      // Fetch a new trial token
      console.log("[TRIAL FLOW] initializeTrialMode - Fetching trial token");
      const tokenResponse = await fetchTrialToken();

      console.log("[TRIAL FLOW] initializeTrialMode - Trial token response:", {
        received: !!tokenResponse.token,
        trialAvailable: tokenResponse.trialAvailable,
        callsUsed: tokenResponse.callsUsed,
        fingerprint: tokenResponse.fingerprint
          ? tokenResponse.fingerprint.substring(0, 8) + "..."
          : null,
        ipAddress: tokenResponse.ipAddress,
      });

      if (!tokenResponse.token) {
        console.error(
          "[TRIAL FLOW] initializeTrialMode - Failed to get trial token"
        );
        setError("Failed to initialize trial mode");
        setStatus(CallStatus.ERROR);
        return false;
      }

      // Set the trial token in state
      setTokenExpirationTime(new Date(Date.now() + 300000)); // 5 minutes

      // Get the trial variant
      // Use non-null assertion to tell TypeScript that fingerprint is not null
      const trialVariant = getTrialVariant(tokenResponse.fingerprint!);
      console.log(
        "[TRIAL FLOW] initializeTrialMode - Trial variant:",
        trialVariant
      );

      // Set trial mode to true
      setIsTrialMode(true);

      // After getting the token, fetch the current trial usage from the database
      // to get the accurate callsRemaining value
      if (tokenResponse.fingerprint && tokenResponse.ipAddress) {
        try {
          const { getTrialUsage } = await import("@/lib/trial-limitations");
          console.log(
            "[TRIAL FLOW] initializeTrialMode - Fetching trial usage from database"
          );
          const usage = await getTrialUsage(
            tokenResponse.ipAddress,
            tokenResponse.fingerprint
          );

          console.log(
            "[TRIAL FLOW] initializeTrialMode - Database trial usage:",
            usage
          );

          // Set the trial calls remaining based on the database response
          setTrialCallsRemaining(usage.callsRemaining);
          console.log(
            "[TRIAL FLOW] initializeTrialMode - Set trial calls remaining to:",
            usage.callsRemaining
          );

          // If no calls remaining, show the conversion modal
          if (usage.callsRemaining <= 0) {
            console.log(
              "[TRIAL FLOW] initializeTrialMode - No calls remaining, showing conversion modal"
            );
            setShowTrialConversionModal(true);
          }
        } catch (error) {
          console.error(
            "[TRIAL FLOW] initializeTrialMode - Error fetching trial usage:",
            error
          );
        }
      } else {
        console.log(
          "[TRIAL FLOW] initializeTrialMode - Missing fingerprint or IP address, cannot fetch trial usage"
        );
      }

      // Use the same device initialization pattern as regular calls
      return await suppressTwilioTokenLogs(async () => {
        // Create new device
        const newDevice = new Device(tokenResponse.token, {
          logLevel: "debug",
          allowIncomingWhileBusy: true,
          closeProtection: true,
          codecPreferences: ["pcmu", "opus"] as any,
        });

        // Set up event handlers
        newDevice.on("registered", () => {
          console.log(
            "[TRIAL FLOW] initializeTrialMode - Twilio trial device is ready"
          );
          setStatus(CallStatus.READY);
          setIsReady(true);
          setIsConnecting(false);
          setTrialTimeRemaining(60); // Reset to 60 seconds
        });

        newDevice.on("error", (error: Error) => {
          console.error(
            "[TRIAL FLOW] initializeTrialMode - Twilio device error:",
            error
          );
          setError(error.message);
          setStatus(CallStatus.ERROR);
          setIsConnecting(false);
        });

        // Register the device
        await newDevice.register();
        setDevice(newDevice);
        console.log(
          "[TRIAL FLOW] initializeTrialMode - Completed successfully"
        );
        return true;
      });
    } catch (error) {
      console.error("[TRIAL FLOW] initializeTrialMode - Error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to initialize trial mode"
      );
      setStatus(CallStatus.ERROR);
      return false;
    }
  }, [
    fetchTrialToken,
    setError,
    setStatus,
    setIsTrialMode,
    setTrialCallsRemaining,
    setDevice,
    setIsReady,
    setIsConnecting,
    setTrialTimeRemaining,
  ]);

  // Add useEffect to fetch current trial usage when component mounts
  useEffect(() => {
    const checkTrialStatus = async () => {
      if (typeof window === "undefined") return;

      // Check if we have trial fingerprint and IP address in localStorage
      const fingerprint = localStorage.getItem("zkypee_trial_fingerprint");
      const ipAddress = localStorage.getItem("zkypee_trial_ip_address");

      if (!fingerprint || !ipAddress) return;

      console.log(
        "[TRIAL FLOW] checkTrialStatus - Found trial data in localStorage:",
        {
          fingerprint: fingerprint.substring(0, 8) + "...",
          ipAddress,
        }
      );

      try {
        // Set trial mode to true if we have trial data
        setIsTrialMode(true);

        // Fetch current trial usage from the database
        const { getTrialUsage } = await import("@/lib/trial-limitations");
        console.log("[TRIAL FLOW] checkTrialStatus - Fetching trial usage");
        const usage = await getTrialUsage(ipAddress, fingerprint);

        console.log(
          "[TRIAL FLOW] checkTrialStatus - Trial usage result:",
          usage
        );

        // Update trial calls remaining based on the database
        setTrialCallsRemaining(usage.callsRemaining);
        console.log(
          "[TRIAL FLOW] checkTrialStatus - Updated trial calls remaining to:",
          usage.callsRemaining
        );

        // If no calls remaining, show the conversion modal
        if (usage.callsRemaining <= 0) {
          console.log(
            "[TRIAL FLOW] checkTrialStatus - No calls remaining, showing conversion modal"
          );
          setShowTrialConversionModal(true);
        }
      } catch (error) {
        console.error("[TRIAL FLOW] checkTrialStatus - Error:", error);
      }
    };

    // Run the check when component mounts or when trial calls remaining changes
    checkTrialStatus();
  }, [
    isTrialMode,
    trialCallsRemaining,
    setTrialCallsRemaining,
    setShowTrialConversionModal,
  ]);

  const value: TwilioContextType = {
    status,
    isReady,
    isConnecting,
    isConnected,
    makeCall,
    hangUp,
    error,
    errorDetails,
    needsUserInteraction,
    initializeDevice,
    testConnection,
    debugInfo,
    deviceDebugInfo: {
      lastAction: debugInfo.lastAction,
      timestamp: debugInfo.timestamp,
      deviceState: debugInfo.status,
      error: debugInfo.error,
    },
    connection,
    callDuration,
    estimatedCost,
    insufficientCredits,
    checkCredits,
    isMuted,
    toggleMute,
    callQuality,
    retryConnection,
    callTo,
    callStartTime,
    resetError,
    // Trial mode properties
    isTrialMode,
    trialCallsRemaining,
    setTrialCallsRemaining,
    trialTimeRemaining,
    initializeTrialMode,
    showTrialConversionModal,
    setShowTrialConversionModal,
  };

  return (
    <TwilioContext.Provider value={value}>{children}</TwilioContext.Provider>
  );
}

export function useTwilio() {
  const context = useContext(TwilioContext);
  if (context === undefined) {
    throw new Error("useTwilio must be used within a TwilioProvider");
  }
  return context;
}
