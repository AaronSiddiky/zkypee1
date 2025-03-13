import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase";

/**
 * API endpoint to record trial usage
 * This is used by the browser client to avoid RLS policy violations
 */
export async function POST(request: Request) {
  try {
    console.log("[TRIAL API] POST /api/trial/record-usage - Request received");

    // Parse the request body
    const body = await request.json();
    const { fingerprint, ipAddress, callSid, duration, phoneNumber } = body;

    // Validate required fields
    if (!fingerprint || !ipAddress || !callSid || duration === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("[TRIAL API] Recording trial usage:", {
      fingerprint: fingerprint.substring(0, 8) + "...",
      ipAddress,
      callSid: callSid.substring(0, 8) + "...",
      duration,
      phoneNumber,
    });

    // Get admin client
    const admin = requireAdmin();

    // First check if record exists
    const { data: existingRecord } = await admin
      .from("trial_calls")
      .select("count, total_duration")
      .eq("device_fingerprint", fingerprint)
      .maybeSingle();

    if (existingRecord) {
      // Update existing record
      console.log("[TRIAL API] Updating existing record");

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
        console.error("[TRIAL API] Error updating trial usage:", error);
        return NextResponse.json(
          { error: "Failed to update trial usage" },
          { status: 500 }
        );
      }

      console.log("[TRIAL API] Successfully updated trial usage");
    } else {
      // Create new record
      console.log("[TRIAL API] Creating new record");

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
        console.error("[TRIAL API] Error creating trial record:", error);
        return NextResponse.json(
          { error: "Failed to create trial record" },
          { status: 500 }
        );
      }

      console.log("[TRIAL API] Successfully created trial record");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TRIAL API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
