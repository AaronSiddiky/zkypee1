import { NextResponse } from "next/server";
import twilio from "twilio";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Allow all origins for now
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    console.log("Call status callback received");

    // Parse the form data
    const formData = await request.formData();

    // Log all form data for debugging
    const formDataObj: Record<string, any> = {};
    formData.forEach((value, key) => {
      formDataObj[key] = value;
    });

    console.log("Call status data:", formDataObj);

    // Extract key status information
    const callSid = formData.get("CallSid") as string;
    const callStatus = formData.get("CallStatus") as string;
    const callDuration = formData.get("CallDuration") as string;

    console.log(
      `Call ${callSid} status: ${callStatus}, duration: ${
        callDuration || "N/A"
      }`
    );

    // Create a TwiML response
    const twiml = new twilio.twiml.VoiceResponse();

    // Return empty TwiML
    return new NextResponse(twiml.toString(), {
      headers: {
        "Content-Type": "text/xml",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in call status callback:", error);

    // Create an empty TwiML response even in case of error
    const twiml = new twilio.twiml.VoiceResponse();

    return new NextResponse(twiml.toString(), {
      headers: {
        "Content-Type": "text/xml",
        ...corsHeaders,
      },
    });
  }
}
