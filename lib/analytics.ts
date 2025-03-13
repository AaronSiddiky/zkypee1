/**
 * Analytics utility for tracking user interactions and events
 * This implementation uses a simple console-based approach that can be
 * replaced with a real analytics provider like Google Analytics, Mixpanel, etc.
 */

// Basic event tracking function
export async function trackEvent(
  eventName: string,
  properties?: Record<string, any>
): Promise<void> {
  try {
    // Log the event to console (for development)
    console.log(`[Analytics] Event: ${eventName}`, properties);

    // In production, you would send this to your analytics provider
    // Example with Google Analytics:
    // if (typeof window.gtag === 'function') {
    //   window.gtag('event', eventName, properties);
    // }

    // Example with Mixpanel:
    // if (typeof window.mixpanel?.track === 'function') {
    //   window.mixpanel.track(eventName, properties);
    // }

    // You could also send events to your backend for custom analytics
    // await fetch('/api/analytics/track', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ event: eventName, properties }),
    // });
  } catch (error) {
    // Don't let analytics errors affect the application
    console.error("[Analytics] Error tracking event:", error);
  }
}

// Trial-specific event tracking
export async function trackTrialEvent(
  action: "start" | "complete" | "convert" | "error",
  data: {
    deviceFingerprint: string;
    callDuration?: number;
    callSid?: string;
    phoneNumber?: string;
    errorMessage?: string;
    userId?: string;
  }
): Promise<void> {
  return trackEvent(`trial_${action}`, {
    ...data,
    timestamp: new Date().toISOString(),
  });
}

// Track trial start
export async function trackTrialStart(fingerprint: string): Promise<void> {
  return trackTrialEvent("start", {
    deviceFingerprint: fingerprint,
  });
}

// Track trial call completion
export async function trackTrialComplete(
  fingerprint: string,
  callDuration: number,
  callSid?: string,
  phoneNumber?: string
): Promise<void> {
  return trackTrialEvent("complete", {
    deviceFingerprint: fingerprint,
    callDuration,
    callSid,
    phoneNumber,
  });
}

// Track trial conversion to signup
export async function trackTrialConversion(
  fingerprint: string,
  userId: string
): Promise<void> {
  return trackTrialEvent("convert", {
    deviceFingerprint: fingerprint,
    userId,
  });
}

// Track trial errors
export async function trackTrialError(
  fingerprint: string,
  errorMessage: string,
  callSid?: string
): Promise<void> {
  return trackTrialEvent("error", {
    deviceFingerprint: fingerprint,
    errorMessage,
    callSid,
  });
}

// Track page views
export async function trackPageView(url: string): Promise<void> {
  return trackEvent("page_view", { url });
}

// Track user signup
export async function trackSignup(
  userId: string,
  method: "email" | "google" | "github" | "trial_conversion"
): Promise<void> {
  return trackEvent("signup", {
    userId,
    method,
    timestamp: new Date().toISOString(),
  });
}

// Track call metrics
export async function trackCallMetrics(
  userId: string | null,
  callSid: string,
  duration: number,
  cost: number,
  quality: string,
  isTrial: boolean = false
): Promise<void> {
  return trackEvent("call_complete", {
    userId,
    callSid,
    duration,
    cost,
    quality,
    isTrial,
    timestamp: new Date().toISOString(),
  });
}

// A/B testing utilities
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
export function getTrialVariant(fingerprint?: string | null) {
  // If no fingerprint is provided, use a default
  const fingerprintToUse = fingerprint || "default_fingerprint";

  // Simple hash function to consistently assign variants
  const hash = fingerprintToUse
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const variants = Object.keys(TRIAL_VARIANTS);
  const variantIndex = hash % variants.length;
  const variant = variants[variantIndex];

  // Track which variant was assigned
  trackEvent("trial_variant_assigned", {
    fingerprint: fingerprintToUse,
    variant,
    config: TRIAL_VARIANTS[variant as keyof typeof TRIAL_VARIANTS],
  });

  return TRIAL_VARIANTS[variant as keyof typeof TRIAL_VARIANTS];
}
