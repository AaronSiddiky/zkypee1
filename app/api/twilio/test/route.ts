import { NextResponse } from "next/server";

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

// Support both GET and POST for easier testing
export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}

// Common handler for both GET and POST
async function handleRequest(request: Request) {
  try {
    console.log("Twilio test API route called");

    // Check if Twilio credentials are set
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKey = process.env.TWILIO_API_KEY;
    const apiSecret = process.env.TWILIO_API_SECRET;
    const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;

    // Log credential status (without revealing actual values)
    console.log("Twilio credentials check:", {
      accountSid: accountSid
        ? `Set (${accountSid.substring(0, 4)}...)`
        : "Missing",
      apiKey: apiKey ? `Set (${apiKey.substring(0, 4)}...)` : "Missing",
      apiSecret: apiSecret ? "Set (hidden)" : "Missing",
      twimlAppSid: twimlAppSid
        ? `Set (${twimlAppSid.substring(0, 4)}...)`
        : "Missing",
    });

    // Check if all required credentials are set
    const credentialsSet = accountSid && apiKey && apiSecret && twimlAppSid;

    return NextResponse.json(
      {
        success: true,
        message: "Twilio test endpoint reached successfully",
        credentialsSet,
        timestamp: new Date().toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Error in test API route:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error in test endpoint",
        error: error.message,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
