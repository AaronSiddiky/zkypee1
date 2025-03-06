import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";
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
 * Test endpoint to verify Twilio credentials
 */
export async function GET(request: NextRequest) {
  try {
    // Check if Twilio credentials are set
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    console.log(`[API:test] Checking Twilio credentials:`, {
      accountSid: accountSid ? `${accountSid.substring(0, 4)}...` : "missing",
      authToken: authToken ? "present" : "missing",
    });

    if (!accountSid || !authToken) {
      console.error("[API:test] Missing Twilio credentials");
      return NextResponse.json(
        { error: "Server configuration error - missing credentials" },
        { status: 500, headers: corsHeaders }
      );
    }

    // Initialize Twilio client
    console.log(`[API:test] Initializing Twilio client`);
    const client = twilio(accountSid, authToken);

    // Try to fetch account info
    console.log(`[API:test] Fetching account info`);
    const account = await client.api.accounts(accountSid).fetch();

    // Get account balance
    console.log(`[API:test] Fetching account balance`);
    const balance = await client.api.accounts(accountSid).balance.fetch();

    console.log(`[API:test] Account info retrieved successfully:`, {
      sid: account.sid,
      friendlyName: account.friendlyName,
      status: account.status,
      balance: balance.balance,
      currency: balance.currency,
    });

    // Return success
    return NextResponse.json(
      {
        success: true,
        account: {
          sid: account.sid,
          friendlyName: account.friendlyName,
          status: account.status,
          balance: balance.balance,
          currency: balance.currency,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("[API:test] Error testing Twilio client:", error);

    // Add more detailed error logging
    if (error.code) {
      console.error(`[API:test] Error code: ${error.code}`);
    }

    if (error.status) {
      console.error(`[API:test] Error status: ${error.status}`);
    }

    if (error.message) {
      console.error(`[API:test] Error message: ${error.message}`);
    }

    // Check if it's a Twilio error
    if (error.moreInfo) {
      console.error(`[API:test] Twilio error info: ${error.moreInfo}`);
    }

    return NextResponse.json(
      {
        error: error.message || "Failed to test Twilio client",
        code: error.code,
        details: error.stack?.split("\n")[0] || "Unknown error",
      },
      { status: 500, headers: corsHeaders }
    );
  }
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
