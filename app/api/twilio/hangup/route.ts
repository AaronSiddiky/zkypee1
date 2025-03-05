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
 * Hangup endpoint to end active Twilio calls
 * Uses server-side credentials to interact with Twilio API
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
      console.error("Unauthorized hangup request - no session");
      return NextResponse.json(
        { error: "Unauthorized - Authentication required" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Get user ID
    const userId = session.user.id;

    // Get active call data from request body if any
    let callSid: string | undefined;
    try {
      const body = await request.json();
      callSid = body.callSid;
    } catch (e) {
      // No body or invalid JSON is acceptable
    }

    // Initialize Twilio client with environment credentials
    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;
    const twilioClient = twilio(accountSid, authToken);

    // If a specific call SID was provided, hang up that call
    if (callSid) {
      try {
        // End the specific call
        await twilioClient.calls(callSid).update({ status: "completed" });

        return NextResponse.json(
          { success: true, message: "Call ended successfully" },
          { headers: corsHeaders }
        );
      } catch (callError: any) {
        console.error("Error ending specific call:", callError);
        return NextResponse.json(
          { error: "Failed to end call", details: callError.message },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // If no specific call SID, look up active calls for this user
    try {
      // Get recent calls for this user
      const calls = await twilioClient.calls.list({
        status: "in-progress",
        limit: 10,
      });

      let hangupCount = 0;

      // End any active calls
      for (const call of calls) {
        try {
          await twilioClient.calls(call.sid).update({ status: "completed" });
          hangupCount++;
        } catch (callError) {
          console.error(`Error ending call ${call.sid}:`, callError);
        }
      }

      return NextResponse.json(
        {
          success: true,
          message: `${hangupCount} active calls ended successfully`,
        },
        { headers: corsHeaders }
      );
    } catch (listError: any) {
      console.error("Error listing active calls:", listError);

      return NextResponse.json(
        { error: "Failed to end calls", details: listError.message },
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error: any) {
    console.error("Error in hangup API:", error);

    return NextResponse.json(
      { error: "Failed to process hangup request" },
      { status: 500, headers: corsHeaders }
    );
  }
}
