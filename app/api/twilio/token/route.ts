import { NextResponse } from "next/server";
import twilio from "twilio";

export async function GET() {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKey = process.env.TWILIO_API_KEY;
    const apiSecret = process.env.TWILIO_API_SECRET;
    const outgoingApplicationSid = process.env.TWILIO_TWIML_APP_SID;
    const identity = `browser-${Date.now()}`;

    // Set token TTL (time-to-live) in seconds
    const tokenTTL = 3600; // 1 hour

    if (!accountSid || !apiKey || !apiSecret || !outgoingApplicationSid) {
      throw new Error("Missing required Twilio credentials");
    }

    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    // Create a Voice grant for this token
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: outgoingApplicationSid,
      incomingAllow: true,
    });

    // Create an access token which we will sign and return to the client
    const token = new AccessToken(accountSid, apiKey, apiSecret, {
      identity: identity,
      ttl: tokenTTL,
    });

    // Add the voice grant to the token
    token.addGrant(voiceGrant);

    // Generate the token string
    const tokenString = token.toJwt();

    console.log(
      `Generated voice token for ${identity}, expires in ${tokenTTL} seconds`
    );

    // Return the token and its TTL
    return NextResponse.json({
      token: tokenString,
      ttl: tokenTTL,
      identity: identity,
    });
  } catch (error) {
    console.error("Error generating token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}

export async function POST() {
  return generateToken();
}

async function generateToken() {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKey = process.env.TWILIO_API_KEY;
    const apiSecret = process.env.TWILIO_API_SECRET;
    const outgoingApplicationSid = process.env.TWILIO_TWIML_APP_SID;
    const identity = `user-${Math.random().toString(36).slice(2)}`;

    // Set token TTL (time-to-live) in seconds
    const tokenTTL = 3600; // 1 hour

    if (!accountSid || !apiKey || !apiSecret || !outgoingApplicationSid) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    // Create a Voice grant for this token
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: outgoingApplicationSid,
      incomingAllow: true, // Allow incoming calls
      outgoingApplicationParams: {
        // These params will be sent to your TwiML app
        applicationSid: outgoingApplicationSid,
        clientName: identity,
      },
    });

    // Create an access token which we will sign and return to the client
    const token = new AccessToken(accountSid, apiKey, apiSecret, {
      identity: identity,
      ttl: tokenTTL,
    });
    token.addGrant(voiceGrant);

    // Generate the token
    const tokenString = token.toJwt();

    return NextResponse.json({
      token: tokenString,
      identity: identity,
      ttl: tokenTTL,
      twilioAccountSid: accountSid,
    });
  } catch (error: any) {
    console.error("Error generating token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
