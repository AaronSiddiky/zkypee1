import { NextResponse, NextRequest } from "next/server";
import twilio from "twilio";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getTokenForUser } from "@/lib/twilio-token";
import rateLimit from "@/lib/rate-limit";
import { hasEnoughCredits } from "@/lib/credits";

// Create a stricter rate limiter for call initiation
// Only 3 calls per minute per user
const callRateLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max number of users
  tokensPerInterval: 3, // Only 3 calls per minute
});

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

    // Apply rate limiting based on user ID
    try {
      await callRateLimiter.check(3, userId);
    } catch (error) {
      console.error("Call rate limit exceeded for user:", userId);
      return NextResponse.json(
        {
          error:
            "You're making calls too quickly. Please wait a moment before trying again.",
        },
        { status: 429, headers: corsHeaders }
      );
    }

    // Get request body
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if user has enough credits for at least a 1-minute call
    const hasCredits = await hasEnoughCredits(userId, 1);
    if (!hasCredits) {
      return NextResponse.json(
        {
          error:
            "Insufficient credits. Please add credits to your account to make calls.",
        },
        { status: 403, headers: corsHeaders }
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

    // Log the call attempt in the database
    try {
      await supabase.from("call_logs").insert({
        user_id: userId,
        call_sid: call.sid,
        duration_minutes: 0.01, // Small positive value for initial log
        credits_used: 0.01, // Small positive value for initial log
        status: call.status,
      });
    } catch (logError) {
      console.error("Failed to log call:", logError);
      // Continue execution even if logging fails
    }

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
