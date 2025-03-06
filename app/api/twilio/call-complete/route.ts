import { NextResponse, NextRequest } from "next/server";
import twilio from "twilio";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { deductCreditsForCall } from "@/lib/credits";

// CORS headers for the call-complete endpoint
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Twilio needs to be able to reach this endpoint
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Call completion endpoint
 * Called by Twilio when a call is completed via the action URL in TwiML
 */
export async function POST(request: NextRequest) {
  try {
    console.log("Call completion endpoint called");

    // Parse the incoming form data
    const formData = await request.formData();

    // Extract relevant information about the call
    const callSid = formData.get("CallSid") as string;
    const callStatus = formData.get("DialCallStatus") as string; // Status of the dial attempt
    const callDuration = formData.get("DialCallDuration") as string; // Duration in seconds
    const to = formData.get("To") as string;

    console.log(
      `Call ${callSid} to ${to} completed with status: ${callStatus}, duration: ${
        callDuration || 0
      } seconds`
    );

    // Convert duration to minutes for billing
    const durationMinutes = callDuration
      ? Math.ceil(parseInt(callDuration) / 60)
      : 1;

    // Setup Supabase client
    const supabase = createServerComponentClient({ cookies });

    // Look up which user made this call from our call_logs table
    const { data: callLogData, error: callLogError } = await supabase
      .from("call_logs")
      .select("user_id")
      .eq("call_sid", callSid)
      .single();

    if (callLogError || !callLogData) {
      console.error("Error looking up call log:", callLogError);
    } else {
      // Deduct credits for the call if it was answered
      if (
        callStatus === "completed" ||
        callStatus === "answered" ||
        parseInt(callDuration || "0") > 0
      ) {
        try {
          const userId = callLogData.user_id;

          // Deduct credits based on the call duration and destination
          await deductCreditsForCall(userId, durationMinutes, callSid, to);

          console.log(
            `Credits deducted for user ${userId} for ${durationMinutes} minute call`
          );
        } catch (creditError) {
          console.error("Error deducting credits:", creditError);
        }
      } else {
        console.log(`No credits deducted for call with status: ${callStatus}`);
      }
    }

    // Create a TwiML response
    const twiml = new twilio.twiml.VoiceResponse();

    // No additional actions needed, just return empty TwiML
    return new NextResponse(twiml.toString(), {
      headers: {
        "Content-Type": "text/xml",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in call completion endpoint:", error);

    // Return empty TwiML even in case of error
    const twiml = new twilio.twiml.VoiceResponse();

    return new NextResponse(twiml.toString(), {
      headers: {
        "Content-Type": "text/xml",
        ...corsHeaders,
      },
    });
  }
}
