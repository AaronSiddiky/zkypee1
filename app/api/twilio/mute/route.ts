import { NextResponse, NextRequest } from "next/server";
import twilio from "twilio";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin":
    process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Mute/unmute endpoint for controlling calls
 * Mutes or unmutes the specified Twilio call
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client for authentication
    const supabase = createServerComponentClient({ cookies });

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      console.error("Unauthorized mute request - no session");
      return NextResponse.json(
        { error: "Unauthorized - Authentication required" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Get user ID
    const userId = session.user.id;

    // Get call SID and mute status from request body
    const { callSid, mute } = await request.json();

    if (!callSid) {
      return NextResponse.json(
        { error: "Call SID is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate that the call belongs to this user
    const { data: callData, error: callError } = await supabase
      .from("call_logs")
      .select("call_sid")
      .eq("user_id", userId)
      .eq("call_sid", callSid)
      .single();

    if (callError || !callData) {
      return NextResponse.json(
        { error: "Call not found or not authorized" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Initialize Twilio client with environment credentials
    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;
    const twilioClient = twilio(accountSid, authToken);

    try {
      // Note: Twilio's update method doesn't directly support muting
      // Instead, we can use the fetch API to call Twilio's REST API directly
      const shouldMute = mute === true || mute === "true";

      // Make direct POST request to Twilio's API
      const twilioApiUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callSid}.json`;
      const twilioAuth = Buffer.from(`${accountSid}:${authToken}`).toString(
        "base64"
      );

      const response = await fetch(twilioApiUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${twilioAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          UpdateStatus: "in-progress", // Keeps the call active
          Muted: shouldMute.toString(), // Mute/unmute the call
        }).toString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Twilio API error: ${errorData.message || "Unknown error"}`
        );
      }

      return NextResponse.json(
        {
          success: true,
          callSid,
          muted: shouldMute,
        },
        { headers: corsHeaders }
      );
    } catch (updateError: any) {
      console.error("Error updating call mute status:", updateError);

      // Check if call is gone or completed
      if (
        updateError.message?.includes("not found") ||
        updateError.message?.includes("20404")
      ) {
        return NextResponse.json(
          { error: "Call no longer active", code: "call_ended" },
          { status: 404, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        { error: "Failed to update call mute status" },
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error: any) {
    console.error("Error in mute API:", error);

    return NextResponse.json(
      { error: "Failed to process mute request" },
      { status: 500, headers: corsHeaders }
    );
  }
}
