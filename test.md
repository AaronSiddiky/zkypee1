# Implementation Plan: "Try Now" Feature

## Overview

Add a "Try Now" feature to allow users to make test calls without signing up, improving mobile conversion rates by reducing friction in the conversion funnel. Each user gets a 1-minute trial call, with usage tracked by IP address in Supabase.

## Current Implementation Analysis

The existing codebase has a robust implementation with:

- TwilioContext managing device state, calls, and credits
- PhoneDialer handling UI and user interactions
- Comprehensive authentication flow
- Credit tracking and call cost management

## Implementation Phases

### 1. Backend Preparation

#### 1.1 Trial Token API Endpoint

Create `app/api/twilio/trial-token/route.ts` by adapting the existing token endpoint:

```typescript
import { createTwilioToken } from "@/lib/twilio";
import {
  getDeviceFingerprint,
  isTrialAvailable,
} from "@/lib/trial-limitations";

export async function GET(request: Request) {
  try {
    // Reuse the same pattern as the authenticated token endpoint
    const fingerprint = await getDeviceFingerprint(request);
    const trialAvailable = await isTrialAvailable(fingerprint);

    if (!trialAvailable) {
      return new Response(
        JSON.stringify({
          error: "Trial not available for this device",
        }),
        { status: 403 }
      );
    }

    // Use the existing token creation function with trial parameters
    const token = await createTwilioToken({
      identity: `trial_${fingerprint}`,
      trialMode: true,
      // Set shorter TTL for trial tokens (5 minutes)
      ttl: 300,
    });

    return new Response(
      JSON.stringify({
        token,
        ttl: 300,
        identity: `trial_${fingerprint}`,
        isTrial: true,
      })
    );
  } catch (error) {
    console.error("Error generating trial token:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate trial token",
      }),
      { status: 500 }
    );
  }
}
```

#### 1.2 Trial Limitations Implementation

Create `lib/trial-limitations.ts` using patterns from existing utility files:

```typescript
import { createHash } from "crypto";
import { supabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit"; // Reuse existing rate limiting

export async function getDeviceFingerprint(request: Request): Promise<string> {
  const userAgent = request.headers.get("user-agent") || "";
  const ip = request.headers.get("x-forwarded-for") || "";

  return createHash("sha256").update(`${userAgent}${ip}`).digest("hex");
}

export async function isTrialAvailable(fingerprint: string): Promise<boolean> {
  // Check rate limiting first (reuse existing rate limiting code)
  const isRateLimited = await rateLimit(`trial:${fingerprint}`, {
    maxRequests: 5,
    window: "1h",
  });

  if (isRateLimited) {
    return false;
  }

  // Check if trial has been used
  const { data, error } = await supabase
    .from("trial_calls")
    .select("count")
    .eq("device_fingerprint", fingerprint)
    .single();

  if (error) {
    console.error("Error checking trial availability:", error);
    return false;
  }

  return !data || data.count < 2; // Allow up to 2 trial calls
}

export async function recordTrialUsage(
  fingerprint: string,
  callSid: string,
  duration: number,
  phoneNumber?: string
): Promise<void> {
  // Use the same upsert pattern as other database operations
  const { error } = await supabase.from("trial_calls").upsert(
    {
      device_fingerprint: fingerprint,
      last_call_at: new Date().toISOString(),
      count: 1,
      last_call_sid: callSid,
      total_duration: duration,
      last_phone_number: phoneNumber,
    },
    {
      onConflict: "device_fingerprint",
      update: {
        count: supabase.raw("trial_calls.count + 1"),
        total_duration: supabase.raw(
          `trial_calls.total_duration + ${duration}`
        ),
        last_call_at: new Date().toISOString(),
        last_call_sid: callSid,
        last_phone_number: phoneNumber,
      },
    }
  );

  if (error) {
    console.error("Error recording trial usage:", error);
    throw error;
  }
}

// Link trial usage to user account when they sign up
export async function linkTrialToUser(
  fingerprint: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("trial_calls")
    .update({ user_id: userId, converted_to_signup: true })
    .eq("device_fingerprint", fingerprint);

  if (error) {
    console.error("Error linking trial to user:", error);
  }
}
```

#### 1.3 Database Schema

Add trial_calls table with fields to track usage and conversion:

```sql
create table trial_calls (
  device_fingerprint text primary key,
  count integer default 0,
  last_call_at timestamp with time zone,
  last_call_sid text,
  last_phone_number text,
  total_duration integer default 0,
  created_at timestamp with time zone default now(),
  user_id uuid references auth.users(id),
  converted_to_signup boolean default false
);

create index idx_trial_calls_fingerprint on trial_calls(device_fingerprint);
create index idx_trial_calls_user_id on trial_calls(user_id);
```

#### 1.4 Trial State Persistence

Create a utility to persist trial state in local storage to prevent bypassing limitations through page refreshes:

```typescript
// lib/trial-persistence.ts
export interface TrialState {
  fingerprint: string;
  callsRemaining: number;
  lastCallAt?: string;
  totalDuration: number;
  hasInitialized: boolean;
}

export function saveTrialState(state: TrialState): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      "zkypee_trial_state",
      JSON.stringify({
        ...state,
        timestamp: Date.now(), // Add timestamp for expiration checks
      })
    );
  } catch (error) {
    console.error("Error saving trial state:", error);
  }
}

export function getTrialState(): TrialState | null {
  if (typeof window === "undefined") return null;

  try {
    const stateJson = localStorage.getItem("zkypee_trial_state");
    if (!stateJson) return null;

    const state = JSON.parse(stateJson);

    // Check if state is expired (24 hours)
    const isExpired = Date.now() - state.timestamp > 24 * 60 * 60 * 1000;
    if (isExpired) {
      localStorage.removeItem("zkypee_trial_state");
      return null;
    }

    return state;
  } catch (error) {
    console.error("Error retrieving trial state:", error);
    return null;
  }
}

export function clearTrialState(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("zkypee_trial_state");
  } catch (error) {
    console.error("Error clearing trial state:", error);
  }
}

// Verify fingerprint matches to prevent tampering
export function verifyTrialStateFingerprint(
  state: TrialState | null,
  currentFingerprint: string
): boolean {
  if (!state) return false;
  return state.fingerprint === currentFingerprint;
}
```

### 2. Context Modifications

#### 2.1 Update TwilioContext

Modify `contexts/TwilioContext.tsx` by reusing existing patterns:

```typescript
interface TwilioContextType {
  // ... existing properties ...
  isTrialMode: boolean;
  trialCallsRemaining: number;
  trialTimeRemaining: number; // in seconds
  initializeTrialMode: () => Promise<boolean>;
  showTrialConversionModal: boolean;
  setShowTrialConversionModal: (show: boolean) => void;
}

export function TwilioProvider({ children }: { children: React.ReactNode }) {
  // ... existing state ...
  const [isTrialMode, setIsTrialMode] = useState(false);
  const [trialCallsRemaining, setTrialCallsRemaining] = useState(2);
  const [trialTimeRemaining, setTrialTimeRemaining] = useState(60); // 60 seconds
  const [showTrialConversionModal, setShowTrialConversionModal] =
    useState(false);
  const trialTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Add trial token fetching - reuse patterns from fetchTwilioToken
  const fetchTrialToken = async (): Promise<string | null> => {
    try {
      console.log("Fetching trial token");

      const response = await fetch(`${apiUrl}/api/twilio/trial-token`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        console.error("Failed to get trial token");
        return null;
      }

      const data = await response.json();
      if (!data.token) {
        console.error("No token received in response");
        return null;
      }

      console.log("Trial token fetched successfully");
      return data.token;
    } catch (err) {
      console.error("Error fetching trial token:", err);
      return null;
    }
  };

  // Add trial mode initialization - reuse patterns from initializeDevice
  const initializeTrialMode = async (): Promise<boolean> => {
    try {
      resetError();
      setStatus(CallStatus.INITIALIZING);
      updateDebugInfo("initialize_trial_mode", "starting", null);

      // Get a trial token
      const token = await fetchTrialToken();
      if (!token) {
        setError("Failed to initialize trial mode");
        setStatus(CallStatus.ERROR);
        updateDebugInfo("initialize_trial_mode", "failed", "No token received");
        return false;
      }

      // Use the same device initialization pattern as regular calls
      return await suppressTwilioTokenLogs(async () => {
        const newDevice = new Device(token, {
          logLevel: "debug",
          allowIncomingWhileBusy: true,
          closeProtection: true,
          codecPreferences: ["pcmu", "opus"] as any,
        });

        // Set up event handlers - reuse the same patterns as regular device
        newDevice.on("registered", () => {
          console.log("✅ Twilio trial device is ready");
          setStatus(CallStatus.READY);
          setIsReady(true);
          setIsConnecting(false);
          setIsTrialMode(true);
          setTrialTimeRemaining(60); // Reset to 60 seconds
        });

        // Copy all other event handlers from the regular device initialization
        newDevice.on("error", (error: Error) => {
          console.error("❌ Twilio device error:", error);
          setError(error.message);
          setStatus(CallStatus.ERROR);
          setIsConnecting(false);
        });

        // Register the device
        await newDevice.register();
        setDevice(newDevice);
        return true;
      });
    } catch (err) {
      console.error("Error initializing trial mode:", err);
      setError(err.message);
      setStatus(CallStatus.ERROR);
      return false;
    }
  };

  // Modify makeCall to handle trial mode - reuse existing patterns
  const makeCall = async (phoneNumber: string): Promise<boolean> => {
    try {
      resetError();

      if (isTrialMode) {
        if (trialCallsRemaining <= 0) {
          setError("Trial calls limit reached. Please sign up to continue.");
          setShowTrialConversionModal(true);
          return false;
        }
      } else {
        // Regular call - check credits as usual
        const hasEnoughCredits = await checkCredits(1);
        if (!hasEnoughCredits) return false;
      }

      // Rest of the existing makeCall implementation
      if (!device || !isReady) {
        const initialized = isTrialMode
          ? await initializeTrialMode()
          : await initializeDevice();
        if (!initialized) return false;
      }

      // Get rate information - reuse existing code
      const response = await fetch(
        `/api/rates/lookup?number=${encodeURIComponent(phoneNumber)}`
      );
      const rateInfo = await response.json();
      const rate = rateInfo.rate || COST_PER_MINUTE;

      setIsConnecting(true);
      setStatus(CallStatus.CONNECTING);
      setCallTo(phoneNumber);

      // Make the call with token suppression - reuse existing code
      return await suppressTwilioTokenLogs(async () => {
        if (!device) {
          throw new Error("Device not initialized");
        }

        const call = await device.connect({
          params: { To: phoneNumber },
        });

        // Store call reference
        setActiveCall(call);

        // Set up call event handlers - reuse existing patterns
        call.on("accept", () => {
          console.log("Call accepted");
          setIsConnected(true);
          setStatus(CallStatus.CONNECTED);

          if (isTrialMode) {
            // Start trial timer
            startTrialCallTracking(rate);
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
            setTrialCallsRemaining((prev) => prev - 1);

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

  // Add trial call tracking - adapt from existing startCallTracking
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
    [callStartTime, isConnected, hangUp]
  );

  // Add trial call tracking stop - adapt from existing stopCallTracking
  const stopTrialCallTracking = useCallback(async () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    if (trialTimerRef.current) {
      clearTimeout(trialTimerRef.current);
      trialTimerRef.current = null;
    }

    // Record trial usage
    if (callStartTime && callDuration > 0 && activeCall?.parameters?.CallSid) {
      try {
        console.log("Recording trial usage:", {
          duration: callDuration,
          callSid: activeCall.parameters.CallSid,
        });

        // Get device fingerprint
        const fingerprint = await getDeviceFingerprint(
          new Request("https://example.com")
        );

        // Record usage in Supabase
        await recordTrialUsage(
          fingerprint,
          activeCall.parameters.CallSid,
          callDuration,
          callTo || undefined
        );
      } catch (error) {
        console.error("Error recording trial usage:", error);
      }
    }

    // Reset call tracking state - same as original
    setCallStartTime(null);
    setCallDuration(0);
    setEstimatedCost(0);
    setCurrentRate(0);
  }, [callStartTime, callDuration, activeCall, callTo]);

  // ... rest of the context implementation

  // Update the context value to include trial properties
  const value: TwilioContextType = {
    // ... existing properties
    isTrialMode,
    trialCallsRemaining,
    trialTimeRemaining,
    initializeTrialMode,
    showTrialConversionModal,
    setShowTrialConversionModal,
  };

  return (
    <TwilioContext.Provider value={value}>{children}</TwilioContext.Provider>
  );
}
```

### 3. UI Implementation

#### 3.1 Update PhoneDialer Component

Modify `components/PhoneDialer.tsx` to add trial UI elements:

```typescript
export default function PhoneDialer({ user, loading }: PhoneDialerProps) {
  // ... existing state and hooks ...
  const [showAuth, setShowAuth] = useState(false);

  // Add trial-specific state from context
  const {
    // ... existing context values
    isTrialMode,
    trialCallsRemaining,
    trialTimeRemaining,
    initializeTrialMode,
    showTrialConversionModal,
    setShowTrialConversionModal,
  } = useTwilio();

  // Render authentication UI with trial option
  if (!loading && !user && !isTrialMode) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-bold mb-4">Make a Call</h1>
        <p className="text-gray-600 mb-6">Enter a phone number to call</p>

        <div className="w-full bg-gradient-to-br from-gray-50 to-blue-50 border border-blue-100 rounded-xl shadow-md p-5 mb-6">
          {/* ... existing auth UI ... */}
          <div className="flex space-x-4 mt-4">
            <button
              onClick={() => setShowAuth(true)}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm transition-all duration-200"
            >
              Sign In
            </button>
            <button
              onClick={() => initializeTrialMode()}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm transition-all duration-200"
            >
              Try Now
            </button>
          </div>

          {/* Trial mode info */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800">
              Trial Mode Limits:
            </h4>
            <ul className="mt-2 text-sm text-yellow-700">
              <li>• Maximum 2 test calls</li>
              <li>• 60 seconds per call</li>
              <li>• Basic features only</li>
            </ul>
          </div>
        </div>

        {/* ... existing auth modal ... */}
      </div>
    );
  }

  // Add trial mode indicator - display during active trial calls
  const TrialModeIndicator = () => {
    if (!isTrialMode) return null;

    return (
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg flex justify-between items-center">
        <div>
          <span className="text-sm font-medium text-yellow-800">
            Trial Call: {trialTimeRemaining}s remaining
          </span>
          <div className="mt-1 text-xs text-yellow-700">
            {trialCallsRemaining} trial call
            {trialCallsRemaining !== 1 ? "s" : ""} remaining
          </div>
        </div>
        <button
          onClick={() => setShowAuth(true)}
          className="text-xs bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-md transition-colors"
        >
          Sign Up
        </button>
      </div>
    );
  };

  // Add trial conversion modal - show after trial call ends
  const TrialConversionModal = () => {
    if (!showTrialConversionModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Your trial call has ended
          </h3>

          <p className="text-gray-600 mb-4">
            Ready to make more calls? Create an account to get started with full
            access.
          </p>

          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <h4 className="font-medium text-blue-800 mb-1">
              With a full account you get:
            </h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li className="flex items-center">
                <svg
                  className="h-4 w-4 mr-2 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Unlimited call duration
              </li>
              <li className="flex items-center">
                <svg
                  className="h-4 w-4 mr-2 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Call anyone worldwide
              </li>
              <li className="flex items-center">
                <svg
                  className="h-4 w-4 mr-2 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Crystal clear HD audio
              </li>
              <li className="flex items-center">
                <svg
                  className="h-4 w-4 mr-2 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Save favorite contacts
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setShowTrialConversionModal(false);
                setShowAuth(true);
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
            >
              Create Account
            </button>
            <button
              onClick={() => setShowTrialConversionModal(false)}
              className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add trial components to the main UI
  return (
    <div className="w-full">
      {/* Add trial indicator at the top */}
      <TrialModeIndicator />

      {/* Rest of the existing PhoneDialer UI */}
      {/* ... */}

      {/* Add trial conversion modal */}
      <TrialConversionModal />
    </div>
  );
}
```

### 4. Authentication Flow Integration

#### 4.1 Trial-to-Signup Conversion

Enhance the authentication flow to link trial usage to new accounts:

```typescript
// components/AuthModal.tsx - Modify the existing auth component

import { useAuth } from "@/contexts/AuthContext";
import { useTwilio } from "@/contexts/TwilioContext";
import { getTrialState, clearTrialState } from "@/lib/trial-persistence";
import { linkTrialToUser } from "@/lib/trial-limitations";

export function AuthModal({ isOpen, onClose }) {
  // ... existing state and hooks ...
  const { user, signUp, signIn } = useAuth();
  const { isTrialMode } = useTwilio();

  // Track if user is converting from trial
  const [isTrialConversion, setIsTrialConversion] = useState(false);

  // Check if this is a trial conversion on mount
  useEffect(() => {
    const trialState = getTrialState();
    setIsTrialConversion(!!trialState && isTrialMode);
  }, [isTrialMode]);

  // Handle successful authentication
  const handleAuthSuccess = useCallback(
    async (newUser) => {
      // If this was a trial conversion, link the trial usage to the new user
      if (isTrialConversion) {
        try {
          const trialState = getTrialState();
          if (trialState?.fingerprint) {
            await linkTrialToUser(trialState.fingerprint, newUser.id);

            // Track conversion in analytics
            trackTrialUsage({
              action: "convert",
              deviceFingerprint: trialState.fingerprint,
            });

            // Clear trial state after successful conversion
            clearTrialState();
          }
        } catch (error) {
          console.error("Error linking trial to user:", error);
        }
      }

      // Continue with normal post-auth flow
      onClose();
    },
    [isTrialConversion, onClose]
  );

  // Modify sign up handler to call handleAuthSuccess
  const handleSignUp = async (email, password, name) => {
    try {
      const newUser = await signUp(email, password, name);
      await handleAuthSuccess(newUser);
    } catch (error) {
      setError(error.message);
    }
  };

  // Modify sign in handler similarly
  const handleSignIn = async (email, password) => {
    try {
      const user = await signIn(email, password);
      await handleAuthSuccess(user);
    } catch (error) {
      setError(error.message);
    }
  };

  // Add trial conversion messaging if applicable
  const renderTrialConversionMessage = () => {
    if (!isTrialConversion) return null;

    return (
      <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-lg">
        <h4 className="text-sm font-medium text-green-800">
          Complete Your Trial Conversion
        </h4>
        <p className="mt-1 text-sm text-green-700">
          Create an account to continue making calls. Your trial usage will be
          linked to your new account.
        </p>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        {/* Add trial conversion message */}
        {renderTrialConversionMessage()}

        {/* Rest of the existing auth UI */}
        {/* ... */}
      </div>
    </Modal>
  );
}
```

#### 4.2 Update PhoneDialer for Seamless Conversion

Modify the PhoneDialer component to handle trial-to-signup transitions:

```typescript
export default function PhoneDialer({ user, loading }: PhoneDialerProps) {
  // ... existing state and hooks ...
  const [showAuth, setShowAuth] = useState(false);

  // Add effect to handle user authentication after trial
  useEffect(() => {
    // If user just authenticated and was in trial mode
    if (user && isTrialMode) {
      // Clear trial mode and transition to regular user
      const handleTrialToUserTransition = async () => {
        try {
          // Initialize regular device with user credentials
          await initializeDevice();

          // Clear trial mode
          setIsTrialMode(false);

          // Show welcome message
          toast({
            title: "Welcome!",
            description:
              "Your account is ready. You can now make unlimited calls.",
            status: "success",
            duration: 5000,
            isClosable: true,
          });
        } catch (error) {
          console.error("Error transitioning from trial to user:", error);
        }
      };

      handleTrialToUserTransition();
    }
  }, [user, isTrialMode, initializeDevice]);

  // Modify the trial conversion modal to use the auth component
  const TrialConversionModal = () => {
    if (!showTrialConversionModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* ... existing content ... */}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setShowTrialConversionModal(false);
                setShowAuth(true); // Open auth modal with context preserved
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
            >
              Create Account
            </button>
            <button
              onClick={() => setShowTrialConversionModal(false)}
              className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ... rest of the component ...

  // Add AuthModal with trial context
  return (
    <div className="w-full">
      {/* ... existing content ... */}

      {/* Auth modal with trial conversion context */}
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
```

### 5. Testing and Analytics

#### 5.1 Trial Usage Tracking

Add analytics events in `lib/analytics.ts` by reusing existing analytics patterns:

```typescript
// Reuse the existing analytics implementation
import { trackEvent } from "@/lib/analytics";

export const trackTrialUsage = async (event: {
  action: "start" | "complete" | "convert";
  callDuration?: number;
  deviceFingerprint: string;
  phoneNumber?: string;
}) => {
  // Use the same tracking pattern as other analytics events
  return trackEvent(`trial_${event.action}`, {
    duration: event.callDuration,
    fingerprint: event.deviceFingerprint,
    phoneNumber: event.phoneNumber,
    timestamp: new Date().toISOString(),
  });
};

// Add these tracking calls at key points in TwilioContext
// When trial mode is initiated
trackTrialUsage({ action: "start", deviceFingerprint });

// When a trial call ends
trackTrialUsage({
  action: "complete",
  callDuration,
  deviceFingerprint,
  phoneNumber: callTo,
});

// When user converts from trial
trackTrialUsage({
  action: "convert",
  deviceFingerprint,
});
```

#### 5.2 A/B Testing Configuration

Implement A/B testing using existing patterns:

```typescript
// Reuse existing A/B testing framework if available
import { getExperimentVariant } from "@/lib/experiments";

const TRIAL_VARIANTS = {
  control: {
    maxCalls: 2,
    maxDuration: 60,
  },
  variant_a: {
    maxCalls: 1,
    maxDuration: 120,
  },
  variant_b: {
    maxCalls: 3,
    maxDuration: 45,
  },
};

// Get the appropriate variant for this user
export function getTrialVariant(fingerprint: string) {
  // Use existing experiment framework if available
  const variant = getExperimentVariant("trial_duration", fingerprint);
  return TRIAL_VARIANTS[variant] || TRIAL_VARIANTS.control;
}
```

#### 5.3 Error Handling and Edge Cases

Reuse existing error handling patterns:

```typescript
// In TwilioContext.tsx
// Handle trial-specific errors
try {
  // Trial call logic
} catch (error) {
  // Use the same error handling pattern as regular calls
  console.error("Trial call error:", error);
  setError(error.message);
  setStatus(CallStatus.ERROR);

  // Track the error using existing analytics
  trackEvent("trial_error", {
    message: error.message,
    fingerprint,
    callSid: activeCall?.parameters?.CallSid,
  });
}
```

## Technical Considerations

### Security

- Rate limiting: Reuse the existing rate limiting implementation from `lib/rate-limit.ts`
- Device fingerprinting: Use IP + user-agent to prevent abuse
- Token security: Apply the same token security measures as regular calls
- Error handling: Use the same error handling patterns to prevent information leakage

### Mobile Optimization

- Responsive UI: Reuse existing responsive components
- Touch-friendly interface: Maintain the same touch targets (44×44px minimum)
- Performance: Reuse existing performance optimizations for mobile
- Network handling: Use the same connection quality monitoring for trial calls

### User Experience

- Clear messaging: Show trial limitations upfront
- Countdown timer: Display remaining time during trial calls
- Conversion flow: Prompt sign-up after trial with compelling benefits
- Error feedback: Use the same error display patterns as regular calls

## Success Metrics

- Trial initiation rate: % of visitors who start a trial call
- Trial completion rate: % of trial calls that reach the full 60 seconds
- Post-trial conversion rate: % of trial users who create an account
- Mobile conversion improvement: Increase in mobile sign-up rate

## Timeline

- Backend Implementation: 3 days
- Context Modifications: 2 days
- UI Implementation: 2 days
- Authentication Flow Integration: 1 day
- Testing and Optimization: 3 days
- Total: 11 days (2-3 weeks)

This implementation plan maximizes reuse of existing code patterns to ensure reliability while adding the new trial mode functionality. By leveraging proven components and patterns, we minimize risk and ensure the feature works consistently across all platforms. The addition of state persistence and seamless authentication flow integration ensures a robust user experience that prevents abuse while encouraging conversion.
