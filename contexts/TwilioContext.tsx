"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { Device } from "@twilio/voice-sdk";
import { useAuth } from "./AuthContext";
import { COST_PER_MINUTE } from "@/lib/stripe";

interface TwilioContextType {
  device: Device | null;
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
    deviceStatus: string;
    isReady: boolean;
    apiResponse: any;
    error: string | null;
  }>;
  deviceDebugInfo: {
    lastAction: string;
    timestamp: number;
    deviceState: string | null;
    error: string | null;
  };
  connection: any;
  token: string | null;
  setupDevice: () => Promise<void>;
  connect: (phoneNumber: string) => void;
  disconnect: () => void;
  makeAICall: (prompt: string, phoneNumber: string) => Promise<any>;
  getAICallStatus: (callId: string) => Promise<any>;
  callDuration: number;
  estimatedCost: number;
  insufficientCredits: boolean;
  checkCredits: (durationMinutes: number) => Promise<boolean>;
  isMuted: boolean;
  toggleMute: () => void;
}

const TwilioContext = createContext<TwilioContextType | undefined>(undefined);

export function TwilioProvider({ children }: { children: React.ReactNode }) {
  const [device, setDevice] = useState<Device | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCall, setActiveCall] = useState<any>(null);
  const { user, loading: authLoading } = useAuth();
  const setupInProgress = useRef(false);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const [deviceDebugInfo, setDeviceDebugInfo] = useState<{
    lastAction: string;
    timestamp: number;
    deviceState: string | null;
    error: string | null;
  }>({
    lastAction: "initial",
    timestamp: Date.now(),
    deviceState: null,
    error: null,
  });
  const initRetryCount = useRef(0);
  const maxRetries = 3;
  const [connection, setConnection] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Function to update debug info
  const updateDebugInfo = (
    action: string,
    deviceState: string | null = null,
    errorMsg: string | null = null
  ) => {
    console.log(
      `[DEBUG] ${action} - Device state: ${deviceState || "unknown"} ${
        errorMsg ? `- Error: ${errorMsg}` : ""
      }`
    );
    setDeviceDebugInfo({
      lastAction: action,
      timestamp: Date.now(),
      deviceState: deviceState,
      error: errorMsg,
    });
  };

  // Function to safely get device state
  const getDeviceState = (dev: Device | null): string => {
    if (!dev) return "null";
    try {
      return (dev as any).status ? (dev as any).status() : "unknown";
    } catch (err: any) {
      return `error_getting_status: ${err.message || "unknown error"}`;
    }
  };

  // Clean up function to properly destroy the device
  const cleanupDevice = async () => {
    if (device) {
      try {
        updateDebugInfo("cleanupDevice_start", getDeviceState(device));
        device.destroy();
        updateDebugInfo("cleanupDevice_destroyed");
      } catch (err: any) {
        console.error("Error destroying device:", err);
        updateDebugInfo("cleanupDevice_error", null, err.message);
      }
    }
    setDevice(null);
    setIsReady(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupDevice();
    };
  }, []);

  // Function to initialize the device
  const initializeDevice = async (): Promise<boolean> => {
    console.log("Initializing Twilio device");
    updateDebugInfo("initializeDevice_start");
    setError(null);

    // Prevent multiple initialization attempts
    if (setupInProgress.current) {
      console.log("Device setup already in progress");
      return false;
    }

    setupInProgress.current = true;

    try {
      // Clean up any existing device
      await cleanupDevice();

      // Check if user exists
      if (!user || !user.id) {
        console.error("No user found for device initialization");
        setError("You must be signed in to make calls. Please sign in first.");
        updateDebugInfo("initializeDevice_no_user", null, "No user found");
        setupInProgress.current = false;
        return false;
      }

      // Fetch a new token
      console.log("Fetching Twilio token");
      updateDebugInfo("initializeDevice_fetching_token");

      const response = await fetch("/api/twilio/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identity: user.id }),
        credentials: "same-origin",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Token fetch failed:", response.status, errorText);
        setError(`Failed to fetch token: ${response.status} ${errorText}`);
        updateDebugInfo(
          "initializeDevice_token_fetch_failed",
          null,
          `${response.status} ${errorText}`
        );
        setupInProgress.current = false;
        return false;
      }

      const data = await response.json();
      const token = data.token;

      if (!token) {
        console.error("No token received");
        setError("No token received from server");
        updateDebugInfo("initializeDevice_no_token", null, "No token received");
        setupInProgress.current = false;
        return false;
      }

      console.log(`Token received (length: ${token.length})`);
      updateDebugInfo("initializeDevice_token_received");

      // Create the device with the token
      try {
        // Create a new device with minimal options
        const newDevice = new Device(token, {
          edge: "ashburn",
          allowIncomingWhileBusy: true,
          // Enable logging but don't use the debug property which causes a type error
          logLevel: "debug" as any,
        });

        console.log("Device created successfully");
        updateDebugInfo("initializeDevice_device_created");

        // Set up device event listeners
        newDevice.on("registered", () => {
          console.log("Device registered event");
          updateDebugInfo("device_event_registered", "registered");
          setIsReady(true);
        });

        newDevice.on("error", (deviceError) => {
          console.error("Device error event:", deviceError);
          updateDebugInfo(
            "device_event_error",
            getDeviceState(newDevice),
            deviceError.message
          );
          setError(`Device error: ${deviceError.message || "Unknown error"}`);
        });

        newDevice.on("unregistered", () => {
          console.log("Device unregistered event");
          updateDebugInfo("device_event_unregistered", "unregistered");
          setIsReady(false);
        });

        newDevice.on("destroyed", () => {
          console.log("Device destroyed event");
          updateDebugInfo("device_event_destroyed", "destroyed");
          setDevice(null);
          setIsReady(false);
        });

        // Set the device in state
        setDevice(newDevice);

        // Register the device
        try {
          console.log("Registering device");
          updateDebugInfo("initializeDevice_registering");
          await newDevice.register();
          console.log("Device registered successfully");
          updateDebugInfo("initializeDevice_registered", "registered");
          setIsReady(true);
          setupInProgress.current = false;
          // Reset retry counter on success
          initRetryCount.current = 0;
          return true;
        } catch (registerError: any) {
          console.error("Error registering device:", registerError);
          updateDebugInfo(
            "initializeDevice_register_error",
            null,
            registerError.message
          );
          setError(`Failed to register device: ${registerError.message}`);

          // Try to recover by retrying
          setupInProgress.current = false;
          if (initRetryCount.current < maxRetries) {
            console.log("Attempting to retry device registration");
            return retryInitialization();
          }

          setupInProgress.current = false;
          return false;
        }
      } catch (deviceError: any) {
        console.error("Error creating device:", deviceError);
        setError(
          `Failed to create device: ${deviceError.message || "Unknown error"}`
        );
        updateDebugInfo(
          "initializeDevice_create_error",
          null,
          deviceError.message
        );

        // Try to recover by retrying
        setupInProgress.current = false;
        if (initRetryCount.current < maxRetries) {
          console.log("Attempting to retry device creation");
          return retryInitialization();
        }

        setupInProgress.current = false;
        return false;
      }
    } catch (error: unknown) {
      console.error("General error in device initialization:", error);
      setError(
        `Initialization error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      updateDebugInfo(
        "initializeDevice_general_error",
        null,
        error instanceof Error ? error.message : "Unknown error"
      );

      // Try to recover by retrying
      setupInProgress.current = false;
      if (initRetryCount.current < maxRetries) {
        console.log("Attempting to retry after general error");
        return retryInitialization();
      }

      setupInProgress.current = false;
      return false;
    }
  };

  // Add a function to retry initialization
  const retryInitialization = async (): Promise<boolean> => {
    if (initRetryCount.current >= maxRetries) {
      console.error(`Maximum retry attempts (${maxRetries}) reached`);
      updateDebugInfo("retryInitialization_max_retries_reached");
      return false;
    }

    console.log(
      `Retrying device initialization (attempt ${
        initRetryCount.current + 1
      }/${maxRetries})`
    );
    updateDebugInfo(
      `retryInitialization_attempt_${initRetryCount.current + 1}`
    );

    initRetryCount.current += 1;

    // Wait a moment before retrying
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Try initialization again
    return initializeDevice();
  };

  // Auto-initialize when user becomes available
  useEffect(() => {
    if (user && !device && !setupInProgress.current) {
      console.log("User available, auto-initializing device");
      updateDebugInfo("auto_initializing_device");
      initializeDevice().catch((err: Error) => {
        console.error("Auto-initialization failed:", err);
        updateDebugInfo("auto_initialization_failed", null, err.message);
      });
    }
  }, [user]);

  // Check if user has enough credits for a call
  const checkCredits = async (durationMinutes: number = 10) => {
    try {
      // Make sure we have a user
      if (!user) {
        console.error("Cannot check credits: No user available");
        setError("Authentication required. Please sign in again.");
        return false;
      }

      // Create a supabase client directly using the supabase-js library
      console.log("Creating direct Supabase client to check credits");
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
      );

      // Query the database directly for the user's credits
      console.log(
        `Querying credit balance for user ${user.id} directly from Supabase`
      );
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("credit_balance")
        .eq("id", user.id)
        .single();

      if (userError) {
        console.error("Error fetching user data from Supabase:", userError);
        setError("Failed to check credit balance");
        return false;
      }

      if (!userData) {
        console.error("No user data found in Supabase");
        setError("User data not found");
        return false;
      }

      const creditBalance = userData.credit_balance || 0;
      console.log(`Credit balance from Supabase: ${creditBalance}`);

      // Changed: Now we only require a positive balance instead of enough for the full duration
      const hasPositiveBalance = creditBalance > 0;

      // Calculate how long the user can talk based on their balance
      const costPerSecond = COST_PER_MINUTE / 60;
      const secondsAvailable = Math.floor(creditBalance / costPerSecond);
      const minutesAvailable = (secondsAvailable / 60).toFixed(1);

      // We still set insufficientCredits if balance is 0 or negative
      setInsufficientCredits(!hasPositiveBalance);

      if (hasPositiveBalance) {
        console.log(
          `User has positive balance: ${creditBalance} credits (allows ~${minutesAvailable} minutes of talk time)`
        );
        return true;
      } else {
        console.log(`No credits available: ${creditBalance}`);
        setError("Insufficient credits. Please add credits to make calls.");
        return false;
      }
    } catch (err) {
      console.error("Error checking credits:", err);
      setError("Failed to check credit balance");
      return false;
    }
  };

  // Start tracking call duration
  const startDurationTracking = () => {
    // Reset duration and cost
    setCallDuration(0);
    setEstimatedCost(0);

    // Calculate the cost per second
    const costPerSecond = COST_PER_MINUTE / 60;

    // Start a timer to update the duration every second
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    durationIntervalRef.current = setInterval(() => {
      setCallDuration((prevDuration) => {
        const newDuration = prevDuration + 1;
        const newCost = parseFloat((newDuration * costPerSecond).toFixed(2));
        setEstimatedCost(newCost);

        // Check if user has run out of credits
        // Get the latest credit balance directly from the DOM
        const creditsElement = document.querySelector(
          ".credit-balance-display"
        );
        let creditBalance = 210; // Fallback default

        if (creditsElement) {
          const displayedCredits = parseInt(
            creditsElement.textContent?.replace(/[^0-9]/g, "") || "210",
            10
          );
          creditBalance = displayedCredits;
        }

        // Check if call cost exceeds available credits
        if (newCost >= creditBalance) {
          console.log(
            `Call ended automatically: Credits exhausted (cost: ${newCost}, balance: ${creditBalance})`
          );
          setError("Call ended: Credits exhausted.");
          stopDurationTracking();
          hangUp();
        }

        return newDuration;
      });
    }, 1000);

    console.log("Started duration tracking");
  };

  // Stop tracking call duration
  const stopDurationTracking = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  // Deduct credits after call ends
  const deductCredits = async () => {
    try {
      if (!user) {
        console.error("Cannot deduct credits: No user available");
        return;
      }

      // Calculate call duration in minutes (rounded up to nearest second)
      const durationMinutes = callDuration / 60;
      const callCost = estimatedCost;

      console.log(
        `Deducting credits for call: ${callCost} credits (${durationMinutes.toFixed(
          2
        )} minutes)`
      );

      // Get the current credit balance
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
      );

      const { data: userData } = await supabase
        .from("users")
        .select("credit_balance")
        .eq("id", user.id)
        .single();

      const currentBalance = userData?.credit_balance || 0;

      // Ensure we never go below zero
      const deductAmount = Math.min(callCost, currentBalance);
      const newBalance = Math.max(0, currentBalance - deductAmount);

      console.log(
        `Credit deduction: ${currentBalance} - ${deductAmount} = ${newBalance}`
      );

      // Update the database with the new balance
      const { error: updateError } = await supabase
        .from("users")
        .update({
          credit_balance: newBalance,
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating user credits in database:", updateError);
      } else {
        console.log(
          `Credits successfully deducted. New balance: ${newBalance}`
        );
      }

      // Record the call in call_logs
      const { error: logError } = await supabase.from("call_logs").insert({
        user_id: user.id,
        duration_minutes: durationMinutes,
        credits_used: deductAmount,
        call_sid: connection?.parameters?.CallSid || "unknown",
        status: "completed",
      });

      if (logError) {
        console.error("Error logging call:", logError);
      }
    } catch (err) {
      console.error("Error deducting credits:", err);
    }
  };

  // Simplified makeCall function
  const makeCall = async (phoneNumber: string) => {
    if (!device) {
      console.error("Twilio device not initialized");
      setError("Twilio device not initialized");
      return false;
    }

    try {
      console.log(`Making call to ${phoneNumber}`);

      // Make sure the device is ready
      if (!isReady) {
        console.log("Device not ready, waiting...");
        setError("Device not ready. Please try again in a moment.");
        return false;
      }

      // Check if user has enough credits for at least 10 minutes of call time
      const hasEnoughCredits = await checkCredits(10);
      if (!hasEnoughCredits) {
        setError(
          "Insufficient credits. Please add more credits to make calls."
        );
        return false;
      }

      // Connect the call
      setIsConnecting(true);

      const params = {
        To: phoneNumber,
      };

      const conn = await device.connect({ params });
      console.log("Call connected:", conn);

      // Set up connection event handlers
      conn.on("accept", () => {
        console.log("Call accepted");
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        // Start tracking call duration
        startDurationTracking();
      });

      conn.on("disconnect", () => {
        console.log("Call disconnected");
        setIsConnected(false);
        setIsConnecting(false);
        setConnection(null);
        // Stop tracking call duration and deduct credits
        stopDurationTracking();
        deductCredits();
      });

      conn.on("error", (err) => {
        console.error("Call error:", err);
        setError(`Call error: ${err.message || "Unknown error"}`);
        setIsConnected(false);
        setIsConnecting(false);
        setConnection(null);
        // Stop tracking call duration
        stopDurationTracking();
      });

      setConnection(conn);
      return true;
    } catch (error) {
      console.error("Error making call:", error);
      setError(
        `Call failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setIsConnecting(false);
      return false;
    }
  };

  // Simplified hangUp function
  const hangUp = () => {
    if (connection) {
      connection.disconnect();
      // Stop tracking call duration and deduct credits
      stopDurationTracking();
      deductCredits();
    }
  };

  // Function to test the connection
  const testConnection = async () => {
    console.log("Testing connection");
    updateDebugInfo("testConnection_start", getDeviceState(device));
    setError(null);

    try {
      // Initialize device if not already initialized
      if (!device || !isReady) {
        console.log("Device not ready, initializing for test");
        const initSuccess = await initializeDevice();
        if (!initSuccess) {
          console.error("Failed to initialize device for test");
          updateDebugInfo(
            "testConnection_init_failed",
            null,
            "Device initialization failed"
          );
          return {
            success: false,
            deviceStatus: "initialization_failed",
            isReady: false,
            apiResponse: null,
            error: "Device initialization failed",
          };
        }
      }

      // Test the API connection
      console.log("Testing API connection");
      updateDebugInfo("testConnection_testing_api");

      const response = await fetch("/api/twilio/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
      });

      const apiResponse = await response.json();
      console.log("API test response:", apiResponse);

      // Check device status
      const deviceStatus = getDeviceState(device);
      console.log("Device status for test:", deviceStatus);

      const success = deviceStatus === "registered" && response.ok;

      if (!success) {
        console.error("Connection test failed");
        updateDebugInfo(
          "testConnection_failed",
          deviceStatus,
          "Connection test failed"
        );
        setError("Connection test failed. Device is not properly registered.");
      } else {
        console.log("Connection test successful");
        updateDebugInfo("testConnection_success", deviceStatus);
      }

      return {
        success,
        deviceStatus,
        isReady,
        apiResponse,
        error: success ? null : "Connection test failed",
      };
    } catch (err: any) {
      console.error("Error in testConnection:", err);
      updateDebugInfo(
        "testConnection_error",
        getDeviceState(device),
        err.message
      );

      return {
        success: false,
        deviceStatus: getDeviceState(device),
        isReady: isReady,
        apiResponse: null,
        error: `Test failed: ${err.message || "Unknown error"}`,
      };
    }
  };

  const setupDevice = async () => {
    try {
      console.log("Setting up Twilio device...");

      // Get token from your backend
      const response = await fetch("/api/twilio/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identity: user?.id || "anonymous" }),
      });

      const data = await response.json();

      if (!data.token) {
        console.error("Failed to get Twilio token");
        setError("Failed to get Twilio token");
        return;
      }

      setToken(data.token);

      // Initialize Twilio device with token
      console.log("Initializing device with token...");
      const newDevice = new Device(data.token, {
        edge: "ashburn",
        allowIncomingWhileBusy: true,
        logLevel: "debug" as any,
      });

      // Set up event listeners before setup
      newDevice.on("registered", () => {
        console.log("Device is ready");
        setIsReady(true);
        setError(null);
      });

      newDevice.on("error", (err: Error) => {
        console.error("Twilio device error:", err);
        setError(`Device error: ${err.message || "Unknown error"}`);
      });

      newDevice.on("connect", (conn) => {
        console.log("Call connected");
        setConnection(conn);
        setIsConnected(true);
        setIsConnecting(false);

        // Set up call event listeners
        conn.on("disconnect", () => {
          console.log("Call disconnected");
          setIsConnected(false);
          setConnection(null);
        });
      });

      // Register the device
      await newDevice.register();
      console.log("Device setup complete");

      setDevice(newDevice);
    } catch (error: unknown) {
      console.error("Error setting up Twilio device:", error);
      setError(
        `Setup error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const connect = (phoneNumber: string) => {
    if (!device) {
      console.error("Twilio device not initialized");
      return;
    }

    try {
      const conn = device.connect({
        params: {
          To: phoneNumber,
        },
      });

      setConnection(conn);
    } catch (error: unknown) {
      console.error("Error connecting call:", error);
    }
  };

  const disconnect = () => {
    if (connection) {
      connection.disconnect();
      setConnection(null);
    }
  };

  const makeAICall = async (prompt: string, phoneNumber: string) => {
    try {
      const response = await fetch("/api/bland-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          phoneNumber,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to schedule AI call");
      }

      const data = await response.json();
      return data;
    } catch (error: unknown) {
      console.error("Error making AI call:", error);
      throw error;
    }
  };

  const getAICallStatus = async (callId: string) => {
    try {
      const response = await fetch(`/api/bland-ai?callId=${callId}`);

      if (!response.ok) {
        throw new Error("Failed to get AI call status");
      }

      const data = await response.json();
      return data;
    } catch (error: unknown) {
      console.error("Error getting AI call status:", error);
      throw error;
    }
  };

  // Function to toggle mute status
  const toggleMute = () => {
    if (connection) {
      try {
        if (isMuted) {
          connection.mute(false);
          console.log("Unmuted call");
        } else {
          connection.mute(true);
          console.log("Muted call");
        }
        setIsMuted(!isMuted);
      } catch (error) {
        console.error("Error toggling mute:", error);
      }
    }
  };

  return (
    <TwilioContext.Provider
      value={{
        device,
        isReady,
        isConnecting,
        isConnected,
        makeCall,
        hangUp,
        error,
        needsUserInteraction,
        initializeDevice,
        testConnection,
        deviceDebugInfo,
        connection,
        token,
        setupDevice,
        connect,
        disconnect,
        makeAICall,
        getAICallStatus,
        callDuration,
        estimatedCost,
        insufficientCredits,
        checkCredits,
        isMuted,
        toggleMute,
      }}
    >
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
