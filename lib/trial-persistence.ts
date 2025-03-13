/**
 * Interface for trial state stored in local storage
 */
export interface TrialState {
  fingerprint: string;
  callsRemaining: number;
  lastCallAt?: string;
  totalDuration: number;
  hasInitialized: boolean;
}

/**
 * Save trial state to local storage
 * @param state The trial state to save
 */
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

/**
 * Get trial state from local storage
 * @returns The trial state or null if not found or expired
 */
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

/**
 * Clear trial state from local storage
 */
export function clearTrialState(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("zkypee_trial_state");
  } catch (error) {
    console.error("Error clearing trial state:", error);
  }
}

/**
 * Verify fingerprint matches to prevent tampering
 * @param state The trial state
 * @param currentFingerprint The current fingerprint
 * @returns Whether the fingerprint matches
 */
export function verifyTrialStateFingerprint(
  state: TrialState | null,
  currentFingerprint: string
): boolean {
  if (!state) return false;
  return state.fingerprint === currentFingerprint;
}

/**
 * Initialize trial state with default values
 * @param fingerprint The device fingerprint
 * @returns The initialized trial state
 */
export function initializeTrialState(fingerprint: string): TrialState {
  return {
    fingerprint,
    callsRemaining: 2,
    totalDuration: 0,
    hasInitialized: true,
  };
}

/**
 * Update trial state after a call
 * @param state The current trial state
 * @param callDuration The duration of the call in seconds
 * @returns The updated trial state
 */
export function updateTrialStateAfterCall(
  state: TrialState,
  callDuration: number
): TrialState {
  return {
    ...state,
    callsRemaining: Math.max(0, state.callsRemaining - 1),
    lastCallAt: new Date().toISOString(),
    totalDuration: state.totalDuration + callDuration,
  };
}
