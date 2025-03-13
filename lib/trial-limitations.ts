import { createHash } from "crypto";
import { supabase, supabaseAdmin, requireAdmin } from "@/lib/supabase";

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined";

/**
 * Safe wrapper for admin operations that works in both browser and server environments
 * In the browser, it will use the regular supabase client
 * On the server, it will use the admin client
 */
function safeAdmin() {
  // In browser context, fall back to regular supabase client
  if (isBrowser) {
    console.log(
      "[TRIAL DB] Using regular supabase client in browser environment"
    );
    return supabase;
  }

  // On server, use the admin client
  try {
    return requireAdmin();
  } catch (error) {
    console.error("[TRIAL DB] Admin client not available:", error);
    return supabase; // Fall back to regular client
  }
}

/**
 * Normalize IP address for storage
 * @param ip The IP address to normalize
 * @returns Normalized IP address
 */
function normalizeIpAddress(ip: string): string {
  console.log("[TRIAL DB] normalizeIpAddress - Input IP:", ip);

  // Handle localhost IPv6
  if (ip === "::1") {
    console.log("[TRIAL DB] normalizeIpAddress - Converting ::1 to 127.0.0.1");
    return "127.0.0.1";
  }

  // Handle localhost IPv4
  if (ip === "localhost" || ip === "::ffff:127.0.0.1") {
    console.log(
      "[TRIAL DB] normalizeIpAddress - Converting localhost/::ffff:127.0.0.1 to 127.0.0.1"
    );
    return "127.0.0.1";
  }

  // Handle IPv6 to IPv4 mapped addresses
  if (ip.startsWith("::ffff:")) {
    const converted = ip.substring(7);
    console.log(
      `[TRIAL DB] normalizeIpAddress - Converting IPv6 mapped address to ${converted}`
    );
    return converted;
  }

  console.log("[TRIAL DB] normalizeIpAddress - No conversion needed");
  return ip;
}

/**
 * Get a device fingerprint from the request
 * @param request The request object
 * @returns A hash of the user agent and IP address
 */
export async function getDeviceFingerprint(request: Request): Promise<string> {
  const userAgent = request.headers.get("user-agent") || "";
  const rawIp = request.headers.get("x-forwarded-for") || "";
  const ip = normalizeIpAddress(rawIp);

  console.log("[TRIAL DB] getDeviceFingerprint - Headers:", {
    userAgent: userAgent.substring(0, 20) + "...",
    rawIp,
    normalizedIp: ip,
  });

  const fingerprint = createHash("sha256")
    .update(`${userAgent}${ip}`)
    .digest("hex");
  console.log(
    "[TRIAL DB] getDeviceFingerprint - Generated:",
    fingerprint.substring(0, 8) + "..."
  );

  return fingerprint;
}

/**
 * Extract the IP address from the request
 * @param request The request object
 * @returns The IP address
 */
export function getIpAddress(request: Request): string {
  const rawIp =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown-ip";

  console.log("[TRIAL DB] getIpAddress - Raw IP from headers:", rawIp);

  const normalizedIp = normalizeIpAddress(rawIp);
  console.log("[TRIAL DB] getIpAddress - Normalized IP:", normalizedIp);

  return normalizedIp;
}

/**
 * Check if a trial is available for the given IP address and fingerprint
 * @param ipAddress The IP address
 * @param fingerprint The device fingerprint
 * @returns Whether a trial is available and the current trial count
 */
export async function isTrialAvailable(
  ipAddress: string,
  fingerprint: string
): Promise<{ available: boolean; count: number }> {
  console.log("[TRIAL DB] isTrialAvailable - Checking availability for:", {
    ipAddress,
    fingerprint: fingerprint.substring(0, 8) + "...",
  });

  // In browser environment, use the API endpoint
  if (isBrowser) {
    console.log(
      "[TRIAL DB] isTrialAvailable - Browser environment detected, using API endpoint"
    );

    try {
      const response = await fetch(
        `/api/trial/check-availability?fingerprint=${encodeURIComponent(
          fingerprint
        )}&ipAddress=${encodeURIComponent(ipAddress)}`
      );

      if (!response.ok) {
        console.error(
          "[TRIAL DB] isTrialAvailable - API request failed:",
          response.status
        );
        return { available: true, count: 0 };
      }

      const data = await response.json();
      console.log("[TRIAL DB] isTrialAvailable - API response:", data);

      return {
        available: data.available !== undefined ? data.available : true,
        count: data.count || 0,
      };
    } catch (fetchError) {
      console.error(
        "[TRIAL DB] isTrialAvailable - Error fetching from API:",
        fetchError
      );
      return { available: true, count: 0 };
    }
  }

  try {
    // First try to get usage by fingerprint
    console.log(
      "[TRIAL DB] isTrialAvailable - Querying by fingerprint:",
      fingerprint.substring(0, 8) + "..."
    );

    const { data: fingerprintData, error: fingerprintError } = await supabase
      .from("trial_calls")
      .select("count")
      .eq("device_fingerprint", fingerprint)
      .maybeSingle();

    console.log("[TRIAL DB] isTrialAvailable - Fingerprint query result:", {
      found: !!fingerprintData,
      data: fingerprintData,
      error: fingerprintError
        ? {
            code: fingerprintError.code,
            message: fingerprintError.message,
          }
        : null,
    });

    // If we found existing data, use it
    if (fingerprintData) {
      const result = {
        available: fingerprintData.count < 2,
        count: fingerprintData.count,
      };
      console.log(
        "[TRIAL DB] isTrialAvailable - Using fingerprint data:",
        result
      );
      return result;
    }

    // If no fingerprint record, try by IP
    console.log("[TRIAL DB] isTrialAvailable - Querying by IP:", ipAddress);
    const { data: ipData, error: ipError } = await supabase
      .from("trial_calls")
      .select("count")
      .filter("ip_address", "eq", ipAddress)
      .maybeSingle();

    console.log("[TRIAL DB] isTrialAvailable - IP query result:", {
      found: !!ipData,
      data: ipData,
      error: ipError
        ? {
            code: ipError.code,
            message: ipError.message,
          }
        : null,
    });

    // If we found IP data, use it
    if (ipData) {
      const result = {
        available: ipData.count < 2,
        count: ipData.count,
      };
      console.log("[TRIAL DB] isTrialAvailable - Using IP data:", result);
      return result;
    }

    // If no record exists, try to create one
    try {
      console.log(
        "[TRIAL DB] isTrialAvailable - No records found, creating new record"
      );
      const admin = safeAdmin();

      // Skip record creation in browser environment to avoid RLS policy violations
      if (isBrowser) {
        console.log(
          "[TRIAL DB] isTrialAvailable - Skipping record creation in browser environment"
        );
        return { available: true, count: 0 };
      }

      const { error } = await admin.from("trial_calls").upsert(
        {
          device_fingerprint: fingerprint,
          ip_address: ipAddress,
          last_call_at: new Date().toISOString(),
          count: 0,
          total_duration: 0,
        },
        {
          onConflict: "device_fingerprint",
          ignoreDuplicates: true,
        }
      );

      if (error) {
        console.error(
          "[TRIAL DB] isTrialAvailable - Error creating new record:",
          error
        );
      } else {
        console.log(
          "[TRIAL DB] isTrialAvailable - Successfully created new record"
        );
      }
    } catch (error) {
      console.log(
        "[TRIAL DB] isTrialAvailable - Could not create record:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }

    // If no records found or couldn't create one, trials are available
    console.log(
      "[TRIAL DB] isTrialAvailable - No records found, trials available"
    );
    return { available: true, count: 0 };
  } catch (error) {
    console.error("[TRIAL DB] isTrialAvailable - Unexpected error:", error);
    // Assume trials are available on error to avoid blocking users
    return { available: true, count: 0 };
  }
}

/**
 * Record trial usage in the database
 * @param ipAddress The IP address
 * @param fingerprint The device fingerprint
 * @param callSid The Twilio call SID
 * @param duration The call duration in seconds
 * @param phoneNumber The phone number called (optional)
 */
export async function recordTrialUsage(
  ipAddress: string,
  fingerprint: string,
  callSid: string,
  duration: number,
  phoneNumber?: string
): Promise<void> {
  console.log("[TRIAL DB] recordTrialUsage - Recording usage:", {
    ipAddress,
    fingerprint: fingerprint.substring(0, 8) + "...",
    callSid: callSid.substring(0, 8) + "...",
    duration,
    phoneNumber,
  });

  try {
    // Always use admin client for trial operations
    const admin = safeAdmin();

    // In browser environment, we need to handle this differently
    if (isBrowser) {
      console.log(
        "[TRIAL DB] recordTrialUsage - Browser environment detected, using API endpoint instead"
      );

      try {
        // Use a fetch call to a server-side API endpoint that will handle the trial usage recording
        const response = await fetch("/api/trial/record-usage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fingerprint,
            ipAddress,
            callSid,
            duration,
            phoneNumber,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to record trial usage: ${response.status}`);
        }

        console.log(
          "[TRIAL DB] recordTrialUsage - Successfully recorded trial usage via API"
        );
        return;
      } catch (fetchError) {
        console.error(
          "[TRIAL DB] recordTrialUsage - Error recording via API:",
          fetchError
        );
        throw fetchError;
      }
    }

    // First check if record exists
    const { data: existingRecord } = await admin
      .from("trial_calls")
      .select("count, total_duration")
      .eq("device_fingerprint", fingerprint)
      .maybeSingle();

    if (existingRecord) {
      // Update existing record
      console.log("[TRIAL DB] recordTrialUsage - Updating existing record");

      const { error } = await admin
        .from("trial_calls")
        .update({
          count: existingRecord.count + 1,
          total_duration: (existingRecord.total_duration || 0) + duration,
          last_call_at: new Date().toISOString(),
          last_call_sid: callSid,
          last_phone_number: phoneNumber,
          ip_address: ipAddress, // Update IP address if it changed
        })
        .eq("device_fingerprint", fingerprint);

      if (error) {
        console.error(
          "[TRIAL DB] recordTrialUsage - Error updating trial usage:",
          error
        );
        throw error;
      }

      console.log(
        "[TRIAL DB] recordTrialUsage - Successfully updated trial usage"
      );
    } else {
      // Create new record
      console.log("[TRIAL DB] recordTrialUsage - Creating new record");

      const { error } = await admin.from("trial_calls").upsert(
        {
          device_fingerprint: fingerprint,
          ip_address: ipAddress,
          last_call_at: new Date().toISOString(),
          last_call_sid: callSid,
          last_phone_number: phoneNumber,
          total_duration: duration,
          count: 1,
        },
        {
          onConflict: "device_fingerprint",
          ignoreDuplicates: false,
        }
      );

      if (error) {
        console.error(
          "[TRIAL DB] recordTrialUsage - Error creating trial record:",
          error
        );
        throw error;
      }

      console.log(
        "[TRIAL DB] recordTrialUsage - Successfully created trial record"
      );
    }
  } catch (error) {
    console.error("[TRIAL DB] recordTrialUsage - Unexpected error:", error);
    throw error;
  }
}

/**
 * Get trial usage statistics
 * @param ipAddress The IP address
 * @param fingerprint The device fingerprint
 * @returns Trial usage statistics
 */
export async function getTrialUsage(
  ipAddress: string,
  fingerprint: string
): Promise<{
  callsUsed: number;
  callsRemaining: number;
  totalDuration: number;
  lastCallAt: string | null;
}> {
  console.log("[TRIAL DB] getTrialUsage - Getting usage for:", {
    ipAddress,
    fingerprint: fingerprint.substring(0, 8) + "...",
  });

  // Default values to return on error or when no record exists
  const defaultResult = {
    callsUsed: 0,
    callsRemaining: 2,
    totalDuration: 0,
    lastCallAt: null,
  };

  // In browser environment, use the API endpoint
  if (isBrowser) {
    console.log(
      "[TRIAL DB] getTrialUsage - Browser environment detected, using API endpoint"
    );

    try {
      const response = await fetch(
        `/api/trial/get-usage?fingerprint=${encodeURIComponent(
          fingerprint
        )}&ipAddress=${encodeURIComponent(ipAddress)}`
      );

      if (!response.ok) {
        console.error(
          "[TRIAL DB] getTrialUsage - API request failed:",
          response.status
        );
        return defaultResult;
      }

      const data = await response.json();
      console.log("[TRIAL DB] getTrialUsage - API response:", data);

      return {
        callsUsed: data.callsUsed || 0,
        callsRemaining: data.callsRemaining || 2,
        totalDuration: data.totalDuration || 0,
        lastCallAt: data.lastCallAt || null,
      };
    } catch (fetchError) {
      console.error(
        "[TRIAL DB] getTrialUsage - Error fetching from API:",
        fetchError
      );
      return defaultResult;
    }
  }

  try {
    // First try to get usage by fingerprint
    console.log(
      "[TRIAL DB] getTrialUsage - Querying by fingerprint:",
      fingerprint.substring(0, 8) + "..."
    );

    const { data: fingerprintData, error: fingerprintError } = await supabase
      .from("trial_calls")
      .select("count, total_duration, last_call_at")
      .eq("device_fingerprint", fingerprint)
      .maybeSingle();

    console.log("[TRIAL DB] getTrialUsage - Fingerprint query result:", {
      found: !!fingerprintData,
      data: fingerprintData
        ? {
            count: fingerprintData.count,
            total_duration: fingerprintData.total_duration,
            last_call_at: fingerprintData.last_call_at,
          }
        : null,
      error: fingerprintError
        ? {
            code: fingerprintError.code,
            message: fingerprintError.message,
          }
        : null,
    });

    // If we found existing data, use it
    if (fingerprintData) {
      const result = {
        callsUsed: fingerprintData.count,
        callsRemaining: Math.max(0, 2 - fingerprintData.count),
        totalDuration: fingerprintData.total_duration || 0,
        lastCallAt: fingerprintData.last_call_at,
      };
      console.log("[TRIAL DB] getTrialUsage - Using fingerprint data:", result);
      return result;
    }

    // If no fingerprint record, try by IP
    console.log("[TRIAL DB] getTrialUsage - Querying by IP:", ipAddress);
    const { data: ipData, error: ipError } = await supabase
      .from("trial_calls")
      .select("count, total_duration, last_call_at")
      .filter("ip_address", "eq", ipAddress)
      .maybeSingle();

    console.log("[TRIAL DB] getTrialUsage - IP query result:", {
      found: !!ipData,
      data: ipData
        ? {
            count: ipData.count,
            total_duration: ipData.total_duration,
            last_call_at: ipData.last_call_at,
          }
        : null,
      error: ipError
        ? {
            code: ipError.code,
            message: ipError.message,
          }
        : null,
    });

    // If we found IP data, use it
    if (ipData) {
      const result = {
        callsUsed: ipData.count,
        callsRemaining: Math.max(0, 2 - ipData.count),
        totalDuration: ipData.total_duration || 0,
        lastCallAt: ipData.last_call_at,
      };
      console.log("[TRIAL DB] getTrialUsage - Using IP data:", result);
      return result;
    }

    // If no record exists, try to create one
    try {
      console.log(
        "[TRIAL DB] getTrialUsage - No records found, creating new record"
      );
      const admin = safeAdmin();

      // Skip record creation in browser environment to avoid RLS policy violations
      if (isBrowser) {
        console.log(
          "[TRIAL DB] getTrialUsage - Skipping record creation in browser environment"
        );
        return defaultResult;
      }

      // Check one more time if the record exists to avoid race conditions
      const { data: doubleCheckRecord } = await admin
        .from("trial_calls")
        .select("count, total_duration, last_call_at")
        .eq("device_fingerprint", fingerprint)
        .maybeSingle();

      if (doubleCheckRecord) {
        console.log(
          "[TRIAL DB] getTrialUsage - Record found on double-check, using existing record"
        );
        const result = {
          callsUsed: doubleCheckRecord.count,
          callsRemaining: Math.max(0, 2 - doubleCheckRecord.count),
          totalDuration: doubleCheckRecord.total_duration || 0,
          lastCallAt: doubleCheckRecord.last_call_at,
        };
        return result;
      }

      // If still no record, try to insert with upsert to handle race conditions
      const { error } = await admin.from("trial_calls").upsert(
        {
          device_fingerprint: fingerprint,
          ip_address: ipAddress,
          last_call_at: new Date().toISOString(),
          count: 0,
          total_duration: 0,
        },
        {
          onConflict: "device_fingerprint",
          ignoreDuplicates: true,
        }
      );

      if (error) {
        console.error(
          "[TRIAL DB] getTrialUsage - Error creating new record:",
          error
        );
      } else {
        console.log(
          "[TRIAL DB] getTrialUsage - Successfully created new record"
        );
      }
    } catch (error) {
      console.log(
        "[TRIAL DB] getTrialUsage - Could not create record:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }

    // Return default values if no records found
    console.log(
      "[TRIAL DB] getTrialUsage - Using default values:",
      defaultResult
    );
    return defaultResult;
  } catch (error) {
    console.error(
      "[TRIAL DB] getTrialUsage - Unexpected error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return defaultResult;
  }
}

/**
 * Generate a device fingerprint on the client side
 * This is a simplified version that works in the browser
 * @returns A hash of browser information
 */
export function getClientFingerprint(): string {
  if (typeof window === "undefined") {
    return "server-side";
  }

  // Collect browser information
  const userAgent = navigator.userAgent;
  const language = navigator.language;
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const colorDepth = window.screen.colorDepth;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Create a string with all the information
  const fingerprint = `${userAgent}|${language}|${screenWidth}x${screenHeight}|${colorDepth}|${timezone}`;

  // Create a simple hash
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Convert to hex string
  const hashHex = (hash >>> 0).toString(16);

  return hashHex;
}

/**
 * Debug function to directly query the trial_calls table
 * This is for debugging purposes only
 */
export async function debugQueryTrialCalls(): Promise<any> {
  try {
    console.log("[TRIAL DB] debugQueryTrialCalls - Querying all trial calls");

    // Use safeAdmin to ensure admin client is available
    const admin = safeAdmin();
    const { data, error } = await admin
      .from("trial_calls")
      .select("*")
      .order("last_call_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("[TRIAL DB] debugQueryTrialCalls - Error:", error);
      return { error };
    }

    // Sanitize the data for logging
    const sanitizedData = data.map((record) => ({
      ...record,
      device_fingerprint: record.device_fingerprint?.substring(0, 8) + "...",
      last_call_sid: record.last_call_sid?.substring(0, 8) + "...",
    }));

    console.log("[TRIAL DB] debugQueryTrialCalls - Results:", sanitizedData);
    return { data: sanitizedData };
  } catch (error) {
    console.error("[TRIAL DB] debugQueryTrialCalls - Unexpected error:", error);
    return { error };
  }
}

/**
 * Link trial usage to user account when they sign up
 * @param fingerprint The device fingerprint
 * @param userId The user ID
 */
export async function linkTrialToUser(
  fingerprint: string,
  userId: string
): Promise<void> {
  console.log("[TRIAL DB] linkTrialToUser - Linking trial to user:", {
    fingerprint: fingerprint.substring(0, 8) + "...",
    userId,
  });

  try {
    const admin = safeAdmin();

    const { error } = await admin
      .from("trial_calls")
      .update({
        user_id: userId,
        converted_to_signup: true,
      })
      .eq("device_fingerprint", fingerprint);

    if (error) {
      console.error(
        "[TRIAL DB] linkTrialToUser - Error linking trial to user:",
        error
      );
      throw error;
    }

    console.log(
      "[TRIAL DB] linkTrialToUser - Successfully linked trial to user"
    );
  } catch (error) {
    console.error(
      "[TRIAL DB] linkTrialToUser - Unexpected error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw error;
  }
}
