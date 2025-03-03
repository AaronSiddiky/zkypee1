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
    } catch (error: any) {
      console.error("General error in device initialization:", error);
      setError(`Initialization error: ${error.message || "Unknown error"}`);
      updateDebugInfo("initializeDevice_general_error", null, error.message);

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

  // Function to make a call
  const makeCall = async (phoneNumber: string) => {
    console.log("Making call to:", phoneNumber);
    updateDebugInfo("makeCall_start");
    setError(null);

    // Default to the specified number if none is provided
    const numberToCall = phoneNumber || "+13324007734";

    // Check if device is ready
    if (!device || !isReady) {
      console.log("Device not ready, attempting to initialize...");
      updateDebugInfo("makeCall_device_not_ready", getDeviceState(device));

      // Try to initialize the device
      const initSuccess = await initializeDevice();
      if (!initSuccess || !device) {
        console.error("Failed to initialize device for call");
        setError("Device initialization failed. Please try again.");
        updateDebugInfo(
          "makeCall_init_failed",
          null,
          "Device initialization failed"
        );
        return false;
      }

      // Wait a moment for the device to fully register
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check again if the device is ready
      if (!isReady) {
        console.error("Device still not ready after initialization");
        setError("Device not ready. Please refresh and try again.");
        updateDebugInfo("makeCall_still_not_ready", getDeviceState(device));
        return false;
      }
    }

    try {
      // Prepare call parameters
      const params = {
        To: numberToCall,
      };

      console.log("Initiating call with params:", params);
      updateDebugInfo("makeCall_initiating", getDeviceState(device));

      // Start connecting state
      setIsConnecting(true);

      // Make the call
      const call = await device.connect({ params });
      console.log("Call initiated successfully");
      updateDebugInfo("makeCall_connected", getDeviceState(device));

      // Set up call event listeners
      call.on("accept", () => {
        console.log("Call accepted event");
        updateDebugInfo("call_event_accept", getDeviceState(device));
        setIsConnected(true);
        setIsConnecting(false);
      });

      call.on("disconnect", () => {
        console.log("Call disconnected event");
        updateDebugInfo("call_event_disconnect", getDeviceState(device));
        setIsConnected(false);
        setIsConnecting(false);
        setActiveCall(null);
      });

      call.on("error", (callError) => {
        console.error("Call error event:", callError);
        updateDebugInfo(
          "call_event_error",
          getDeviceState(device),
          callError.message
        );
        setError(`Call error: ${callError.message}`);
        setIsConnected(false);
        setIsConnecting(false);
        setActiveCall(null);
      });

      // Store the active call
      setActiveCall(call);
      return true;
    } catch (callError: any) {
      console.error("Error making call:", callError);
      updateDebugInfo(
        "makeCall_error",
        getDeviceState(device),
        callError.message
      );
      setError(`Failed to make call: ${callError.message}`);
      setIsConnecting(false);
      return false;
    }
  };

  // Function to hang up a call
  const hangUp = () => {
    console.log("Hanging up call");
    updateDebugInfo("hangUp_start", getDeviceState(device));

    if (activeCall) {
      try {
        activeCall.disconnect();
        console.log("Call disconnected successfully");
        updateDebugInfo("hangUp_success", getDeviceState(device));
      } catch (err: any) {
        console.error("Error hanging up call:", err);
        updateDebugInfo("hangUp_error", getDeviceState(device), err.message);
      }
    } else {
      console.log("No active call to hang up");
      updateDebugInfo("hangUp_no_active_call", getDeviceState(device));
    }

    setIsConnected(false);
    setIsConnecting(false);
    setActiveCall(null);
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
