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
      });

      conn.on("disconnect", () => {
        console.log("Call disconnected");
        setIsConnected(false);
        setIsConnecting(false);
        setConnection(null);
      });

      conn.on("error", (err) => {
        console.error("Call error:", err);
        setError(`Call error: ${err.message || "Unknown error"}`);
        setIsConnected(false);
        setIsConnecting(false);
        setConnection(null);
      });

      setConnection(conn);
      return true;
    } catch (error) {
      console.error("Error making call:", error);
      setError(`Call failed: ${error.message || "Unknown error"}`);
      setIsConnecting(false);
      return false;
    }
  };

  // Simplified hangUp function
  const hangUp = () => {
    if (connection) {
      try {
        connection.disconnect();
        console.log("Call disconnected");
      } catch (error) {
        console.error("Error hanging up call:", error);
      }
    }

    setIsConnected(false);
    setIsConnecting(false);
    setConnection(null);
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
