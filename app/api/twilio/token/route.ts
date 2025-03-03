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
    console.log("Token API route called");

    // Get identity from request body
    let identity;
    try {
      const body = await request.json();
      identity = body.identity;
      console.log("Received identity:", identity);
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!identity) {
      console.error("No identity provided in request");
      return NextResponse.json(
        { error: "Identity is required" },
        { status: 400, headers: corsHeaders }
      );
    }

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

    if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
      console.error("Missing Twilio credentials:", {
        accountSid: accountSid ? "Set" : "Missing",
        apiKey: apiKey ? "Set" : "Missing",
        apiSecret: apiSecret ? "Set" : "Missing",
        twimlAppSid: twimlAppSid ? "Set" : "Missing",
      });
      return NextResponse.json(
        { error: "Missing Twilio credentials" },
        { status: 500, headers: corsHeaders }
      );
    }

    // Create an access token
    console.log("Creating Twilio access token");
    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    // Create a Voice grant for this token
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true,
    });

    // Create an access token which we will sign and return to the client
    try {
      console.log("Initializing AccessToken with:", {
        accountSid: `${accountSid.substring(0, 4)}...`,
        apiKey: `${apiKey.substring(0, 4)}...`,
        identity,
      });

      // Set token TTL to 1 hour (3600 seconds)
      const token = new AccessToken(accountSid, apiKey, apiSecret, {
        identity,
        ttl: 3600,
      });

      // Add the voice grant to our token
      token.addGrant(voiceGrant);

      // Serialize the token to a JWT string
      const tokenString = token.toJwt();
      console.log("Token generated successfully, length:", tokenString.length);

      return NextResponse.json(
        { token: tokenString },
        { headers: corsHeaders }
      );
    } catch (tokenError: any) {
      console.error("Error creating token:", tokenError);
      console.error("Error details:", tokenError.stack);

      // Check for specific error types
      let errorMessage = "Failed to create token";
      let errorDetails = tokenError.message;

      if (tokenError.message.includes("API Key")) {
        errorMessage = "Invalid Twilio API Key";
        errorDetails = "Please check your TWILIO_API_KEY environment variable";
      } else if (tokenError.message.includes("API Secret")) {
        errorMessage = "Invalid Twilio API Secret";
        errorDetails =
          "Please check your TWILIO_API_SECRET environment variable";
      } else if (tokenError.message.includes("Account SID")) {
        errorMessage = "Invalid Twilio Account SID";
        errorDetails =
          "Please check your TWILIO_ACCOUNT_SID environment variable";
      }

      return NextResponse.json(
        {
          error: errorMessage,
          message: tokenError.message,
          details: errorDetails,
        },
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error: any) {
    console.error("Error in token API route:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      {
        error: "Failed to generate token",
        message: error.message,
        details: error.stack,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
