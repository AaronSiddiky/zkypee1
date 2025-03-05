import { NextResponse, NextRequest } from "next/server";
import twilio from "twilio";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getTokenForUser } from "../token/route";

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
 * Proxy API for making voice calls
 * Uses server-side tokens without exposing them to the client
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
      console.error("Unauthorized voice call request - no session");
      return NextResponse.json(
        { error: "Unauthorized - Authentication required" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Get user ID
    const userId = session.user.id;

    // Get request body
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get user's token from server-side cache
    const token = getTokenForUser(userId);

    if (!token) {
      // Generate a new token if needed
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Include the session cookie for authentication
          Cookie: request.headers.get("cookie") || "",
        },
      });

      // Try to get the token again
      const newToken = getTokenForUser(userId);

      if (!newToken) {
        return NextResponse.json(
          { error: "Could not initialize Twilio capabilities" },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // Initialize Twilio client with environment credentials
    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;
    const twilioClient = twilio(accountSid, authToken);

    // Check credit balance or other prerequisites here

    // Make the call using Twilio's REST API directly
    const call = await twilioClient.calls.create({
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER!, // Your Twilio phone number
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/twiml`,
      statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/status-callback`,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      statusCallbackMethod: "POST",
    });

    return NextResponse.json(
      {
        success: true,
        callSid: call.sid,
        status: call.status,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Error in voice call API:", error);

    return NextResponse.json(
      { error: "Failed to initiate call" },
      { status: 500, headers: corsHeaders }
    );
  }
}
