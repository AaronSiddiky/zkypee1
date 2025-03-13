import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase";

/**
 * API endpoint to get trial usage
 * This is used by the browser client to avoid RLS policy violations
 */
export async function GET(request: Request) {
  try {
    console.log("[TRIAL API] GET /api/trial/get-usage - Request received");

    // Get query parameters
    const url = new URL(request.url);
    const fingerprint = url.searchParams.get("fingerprint");
    const ipAddress = url.searchParams.get("ipAddress");

    // Validate required fields
    if (!fingerprint || !ipAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("[TRIAL API] Getting trial usage:", {
      fingerprint: fingerprint.substring(0, 8) + "...",
      ipAddress,
    });

    // Default values to return on error or when no record exists
    const defaultResult = {
      callsUsed: 0,
      callsRemaining: 2,
      totalDuration: 0,
      lastCallAt: null,
    };

    // Get admin client
    const admin = requireAdmin();

    // First try to get usage by fingerprint
    const { data: fingerprintData, error: fingerprintError } = await admin
      .from("trial_calls")
      .select("count, total_duration, last_call_at")
      .eq("device_fingerprint", fingerprint)
      .maybeSingle();

    // If we found existing data, use it
    if (fingerprintData) {
      const result = {
        callsUsed: fingerprintData.count,
        callsRemaining: Math.max(0, 2 - fingerprintData.count),
        totalDuration: fingerprintData.total_duration || 0,
        lastCallAt: fingerprintData.last_call_at,
      };
      console.log("[TRIAL API] Using fingerprint data:", result);
      return NextResponse.json(result);
    }

    // If no fingerprint record, try by IP
    const { data: ipData, error: ipError } = await admin
      .from("trial_calls")
      .select("count, total_duration, last_call_at")
      .filter("ip_address", "eq", ipAddress)
      .maybeSingle();

    // If we found IP data, use it
    if (ipData) {
      const result = {
        callsUsed: ipData.count,
        callsRemaining: Math.max(0, 2 - ipData.count),
        totalDuration: ipData.total_duration || 0,
        lastCallAt: ipData.last_call_at,
      };
      console.log("[TRIAL API] Using IP data:", result);
      return NextResponse.json(result);
    }

    // If no record exists, create one
    console.log("[TRIAL API] No records found, creating new record");

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
      console.error("[TRIAL API] Error creating new record:", error);
    } else {
      console.log("[TRIAL API] Successfully created new record");
    }

    // Return default values
    console.log("[TRIAL API] Using default values:", defaultResult);
    return NextResponse.json(defaultResult);
  } catch (error) {
    console.error("[TRIAL API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
