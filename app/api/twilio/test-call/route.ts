import { NextResponse, NextRequest } from "next/server";
import twilio from "twilio";
import { corsHeaders, handleCors } from "@/lib/cors";

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return (
    handleCors(request.method) ||
    NextResponse.json({}, { headers: corsHeaders })
  );
}

/**
 * Test endpoint to verify Twilio can make calls
 * This makes a call to Twilio's test number
 */
export async function GET(request: NextRequest) {
  try {
    // Check if Twilio credentials are set
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

    console.log(`[API:test-call] Checking Twilio credentials:`, {
      accountSid: accountSid ? `${accountSid.substring(0, 4)}...` : "missing",
      authToken: authToken ? "present" : "missing",
      twilioNumber: twilioNumber || "missing",
    });

    if (!accountSid || !authToken || !twilioNumber) {
      console.error("[API:test-call] Missing Twilio credentials");
      return NextResponse.json(
        { error: "Server configuration error - missing credentials" },
        { status: 500, headers: corsHeaders }
      );
    }

    // Initialize Twilio client
    console.log(`[API:test-call] Initializing Twilio client`);
    const client = twilio(accountSid, authToken);

    // Base URL for the application
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Check if we're using localhost, which won't work with Twilio
    if (baseUrl.includes("localhost")) {
      console.error(
        `[API:test-call] Error: Twilio requires a publicly accessible URL for TwiML`
      );
      console.error(`[API:test-call] Current base URL is: ${baseUrl}`);
      console.error(
        `[API:test-call] Please use a service like ngrok to expose your local server to the internet`
      );

      return NextResponse.json(
        {
          error: "Twilio requires a publicly accessible URL",
          details:
            "You are using a localhost URL which Twilio cannot access. Please use a service like ngrok to expose your local server to the internet, then update your NEXT_PUBLIC_BASE_URL environment variable.",
        },
        { status: 500, headers: corsHeaders }
      );
    }

    const twimlUrl = `${baseUrl}/api/twilio/twiml`;

    // Use Twilio's test number
    const testNumber = "+15005550006"; // This is Twilio's test number that will always succeed

    console.log(`[API:test-call] TwiML URL: ${twimlUrl}`);
    console.log(`[API:test-call] Making test call to ${testNumber}`);

    // Make the call
    try {
      const call = await client.calls.create({
        to: testNumber,
        from: twilioNumber,
        url: twimlUrl,
      });

      console.log(`[API:test-call] Test call initiated:`, {
        sid: call.sid,
        status: call.status,
        direction: call.direction,
      });

      // Return success
      return NextResponse.json(
        {
          success: true,
          call: {
            sid: call.sid,
            status: call.status,
            direction: call.direction,
            from: call.from,
            to: call.to,
          },
        },
        { headers: corsHeaders }
      );
    } catch (callError: any) {
      console.error(`[API:test-call] Error making test call:`, callError);

      // Log detailed error information
      if (callError.code) {
        console.error(`[API:test-call] Error code: ${callError.code}`);
      }
      if (callError.moreInfo) {
        console.error(`[API:test-call] Error info: ${callError.moreInfo}`);
      }

      return NextResponse.json(
        {
          error: callError.message || "Failed to make test call",
          code: callError.code,
          details: callError.moreInfo || callError.message,
        },
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error: any) {
    console.error("[API:test-call] Error in test call endpoint:", error);

    // Add more detailed error logging
    if (error.code) {
      console.error(`[API:test-call] Error code: ${error.code}`);
    }

    if (error.status) {
      console.error(`[API:test-call] Error status: ${error.status}`);
    }

    if (error.message) {
      console.error(`[API:test-call] Error message: ${error.message}`);
    }

    return NextResponse.json(
      {
        error: error.message || "Failed to test Twilio call",
        code: error.code,
        details: error.stack?.split("\n")[0] || "Unknown error",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
