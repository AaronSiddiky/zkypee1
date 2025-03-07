import { NextResponse, NextRequest } from "next/server";
import twilio from "twilio";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Get the phone number from the request
    const { phoneNumber } = await request.json();
    console.log("[API:call] Making call to:", phoneNumber);

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Missing phone number" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if Twilio credentials are set
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioNumber) {
      console.error("[API:call] Missing Twilio credentials");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500, headers: corsHeaders }
      );
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    // Use environment variable for base URL
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
      "https://zkypee.com";
    const twimlUrl = `${baseUrl}/api/twilio/twiml?To=${encodeURIComponent(
      phoneNumber
    )}`;

    console.log("[API:call] TwiML URL:", twimlUrl);

    // Make the call
    console.log(
      `[API:call] Creating call from ${twilioNumber} to ${phoneNumber}`
    );
    const call = await client.calls.create({
      to: phoneNumber,
      from: twilioNumber,
      url: twimlUrl,
      statusCallback: `${baseUrl}/api/twilio/call-status`,
      statusCallbackMethod: "POST",
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      record: true,
      trim: "trim-silence",
      machineDetection: "Enable",
    });

    console.log(`[API:call] Call initiated successfully:`, {
      sid: call.sid,
      status: call.status,
    });

    // Return call information
    return NextResponse.json(
      {
        callSid: call.sid,
        status: call.status,
        from: call.from,
        to: call.to,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("[API:call] Error making call:", error);
    return NextResponse.json(
      {
        error: "Failed to make call",
        details: error.message,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
