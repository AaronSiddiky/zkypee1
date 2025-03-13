import { NextResponse } from "next/server";
import twilio from "twilio";
import {
  getDeviceFingerprint,
  getIpAddress,
  isTrialAvailable,
  getTrialUsage,
} from "@/lib/trial-limitations";

/**
 * Generate a Twilio token for trial users
 */
export async function GET(request: Request) {
  console.log("[TRIAL API] GET /api/twilio/trial-token - Request received");

  try {
    // Get request details for debugging
    const url = new URL(request.url);
    const headers = Object.fromEntries(request.headers.entries());
    console.log("[TRIAL API] Request details:", {
      url: url.toString(),
      headers: {
        "user-agent": headers["user-agent"]?.substring(0, 30) + "...",
        "x-forwarded-for": headers["x-forwarded-for"],
        "x-real-ip": headers["x-real-ip"],
        referer: headers["referer"],
      },
    });

    // Get device fingerprint and IP address
    const fingerprint = await getDeviceFingerprint(request);
    const ipAddress = getIpAddress(request);
    console.log("[TRIAL API] Identifiers:", {
      fingerprint: fingerprint.substring(0, 8) + "...",
      ipAddress,
    });

    // Get current trial usage for debugging
    const currentUsage = await getTrialUsage(ipAddress, fingerprint);
    console.log("[TRIAL API] Current usage:", {
      ipAddress,
      fingerprint: fingerprint.substring(0, 8) + "...",
      usage: currentUsage,
    });

    // Check if trial is available using both IP and fingerprint
    console.log("[TRIAL API] Checking trial availability");
    const { available, count } = await isTrialAvailable(ipAddress, fingerprint);
    console.log("[TRIAL API] Trial availability check result:", {
      available,
      count,
      ipAddress,
      fingerprint: fingerprint.substring(0, 8) + "...",
    });

    if (!available) {
      console.log("[TRIAL API] Trial not available:", {
        ipAddress,
        fingerprint: fingerprint.substring(0, 8) + "...",
        count,
        currentUsage,
      });
      return NextResponse.json(
        {
          error: "Trial not available for this device",
          debug: {
            ipAddress,
            fingerprint: fingerprint.substring(0, 8) + "...",
            count,
            currentUsage,
          },
        },
        { status: 403 }
      );
    }

    // Get Twilio credentials
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKey = process.env.TWILIO_API_KEY;
    const apiSecret = process.env.TWILIO_API_SECRET;
    const outgoingApplicationSid = process.env.TWILIO_TWIML_APP_SID;
    const identity = `trial_${fingerprint.substring(0, 16)}`;

    // Set token TTL (time-to-live) in seconds - shorter for trial tokens
    const tokenTTL = 300; // 5 minutes

    if (!accountSid || !apiKey || !apiSecret || !outgoingApplicationSid) {
      console.error("[TRIAL API] Missing required Twilio credentials");
      throw new Error("Missing required Twilio credentials");
    }

    console.log("[TRIAL API] Generating Twilio token");
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

    const response = {
      token: tokenString,
      ttl: tokenTTL,
      identity: identity,
      isTrial: true,
      fingerprint: fingerprint,
      ipAddress: ipAddress,
      trialCallsUsed: count,
      trialCallsRemaining: Math.max(0, 2 - count),
      debug: {
        currentUsage,
        timestamp: new Date().toISOString(),
      },
    };

    console.log("[TRIAL API] Generated trial voice token:", {
      identity,
      ttl: tokenTTL,
      ipAddress,
      fingerprint: fingerprint.substring(0, 8) + "...",
      trialCallsUsed: count,
      trialCallsRemaining: Math.max(0, 2 - count),
      currentUsage,
    });

    // Return the token and its TTL
    return NextResponse.json(response);
  } catch (error) {
    console.error("[TRIAL API] Error generating trial token:", error);
    return NextResponse.json(
      {
        error: "Failed to generate trial token",
        debug: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
