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
import { registerTokenFilterServiceWorker } from "@/lib/serviceWorker";

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
}

const TwilioContext = createContext<TwilioContextType | undefined>(undefined);

// Register the token filter service worker when in browser environment
if (typeof window !== "undefined") {
  registerTokenFilterServiceWorker();
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

  // Function to stop tracking and deduct credits
  const stopCallTracking = useCallback(async () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    // Only deduct credits if there was an actual call
    if (
      callStartTime &&
      user &&
      callDuration > 0 &&
      activeCall?.parameters?.CallSid
    ) {
      try {
        console.log("Deducting credits for call:", {
          duration: callDuration,
          rate: currentRate,
          estimatedCost,
          callSid: activeCall.parameters.CallSid,
        });

        // Convert seconds to minutes for billing (round up to nearest minute)
        const durationMinutes = Math.ceil(callDuration / 60);

        // Deduct credits using the API
        const response = await fetch("/api/credits/deduct", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            durationMinutes,
            callSid: activeCall.parameters.CallSid,
            phoneNumber: callTo,
            rate: currentRate,
            creditsToDeduct: estimatedCost,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Failed to deduct credits:", errorData);
          throw new Error(errorData.error || "Failed to deduct credits");
        }

        const result = await response.json();
        console.log("Credits deducted successfully:", result);
      } catch (error) {
        console.error("Error deducting credits:", error);
        setError(
          "Failed to deduct credits from your account. Please contact support."
        );
      }
    } else {
      console.log("No credits to deduct:", {
        hasCallStartTime: !!callStartTime,
        hasUser: !!user,
        duration: callDuration,
        hasCallSid: !!activeCall?.parameters?.CallSid,
      });
    }

    // Reset call tracking state
    setCallStartTime(null);
    setCallDuration(0);
    setEstimatedCost(0);
    setCurrentRate(0);
  }, [
    callStartTime,
    user,
    callDuration,
    activeCall,
    callTo,
    currentRate,
    estimatedCost,
  ]);

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

      if (!device || !isReady) {
        const initialized = await initializeDevice();
        if (!initialized) return false;
      }

      // Get rate information before making the call
      const response = await fetch(
        `/api/rates/lookup?number=${encodeURIComponent(phoneNumber)}`
      );
      const rateInfo = await response.json();
      const rate = rateInfo.rate || COST_PER_MINUTE;

      // Check if user has enough credits
      const hasEnoughCredits = await checkCredits(1); // Check for at least 1 minute
      if (!hasEnoughCredits) return false;

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
          startCallTracking(rate);
        });

        call.on("disconnect", () => {
          console.log("Call disconnected");
          setIsConnected(false);
          setStatus(CallStatus.IDLE);
          stopCallTracking();
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
      setError(error.message);
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
