import { NextResponse } from "next/server";
import twilio from "twilio";
import { corsHeaders } from "@/lib/cors";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/lib/database.types";
import { deductCreditsForCall } from "@/lib/credits";

const VoiceResponse = twilio.twiml.VoiceResponse;

// Handle call status callbacks from Twilio
export async function POST(request: Request) {
  try {
    console.log("📞 [Call Status] Callback received");

    // Parse the form data
    const formData = await request.formData();

    // Log all form data for debugging
    const formDataObj: Record<string, any> = {};
    formData.forEach((value, key) => {
      formDataObj[key] = value;
    });

    console.log("📞 [Call Status] Data:", formDataObj);

    // Log headers for debugging
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log("📞 [Call Status] Request headers:", headers);

    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Extract key status information
    const callSid = formData.get("CallSid") as string;
    const callStatus = formData.get("CallStatus") as string;
    const callDuration = formData.get("CallDuration") as string;
    const phoneNumber = formData.get("To") as string;

    // Log the call status for debugging
    console.log("[Call Status]", {
      callSid,
      callStatus,
      duration: callDuration,
      phoneNumber,
      timestamp: new Date().toISOString(),
    });

    // Look up the call log
    const { data: callLogData, error: callLogError } = await supabase
      .from("call_logs")
      .select("user_id, status")
      .eq("call_sid", callSid)
      .single();

    if (callLogError) {
      console.error("Error looking up call log:", callLogError);
    } else if (callLogData) {
      // Update call status
      const { error: updateError } = await supabase
        .from("call_logs")
        .update({ status: callStatus })
        .eq("call_sid", callSid);

      if (updateError) {
        console.error("Error updating call status:", updateError);
      }

      // If the call is completed, handle credit deduction
      if (callStatus === "completed" && callDuration) {
        try {
          // Convert duration to minutes for billing (round up to nearest minute)
          const durationMinutes = Math.ceil(parseInt(callDuration) / 60);

          // Deduct credits for the call
          await deductCreditsForCall(
            callLogData.user_id,
            durationMinutes,
            callSid,
            phoneNumber
          );

          console.log(
            `Credits deducted for user ${callLogData.user_id} for ${durationMinutes} minute call`
          );
        } catch (creditError) {
          console.error("Error deducting credits:", creditError);
        }
      }
    }

    // Create a TwiML response
    const twiml = new VoiceResponse();

    // Return TwiML as XML with CORS headers
    return new NextResponse(twiml.toString(), {
      headers: {
        "Content-Type": "text/xml",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error handling call status:", error);

    // Even on error, return a valid TwiML response
    const twiml = new VoiceResponse();
    return new NextResponse(twiml.toString(), {
      headers: {
        "Content-Type": "text/xml",
        ...corsHeaders,
      },
    });
  }
}

// Support OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
