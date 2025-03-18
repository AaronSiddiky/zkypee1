import { NextResponse, NextRequest } from "next/server";
import twilio from "twilio";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { corsHeaders } from "@/lib/cors";
import { DEFAULT_TWILIO_PHONE_NUMBER } from "../phone-number";

// Create TwiML response for connecting directly to a phone number
function generateTwiML(phoneNumber: string, outgoingNumber?: string) {
  const twiml = new twilio.twiml.VoiceResponse();

  // Connect to phone number with proper configuration for two-way audio
  const dial = twiml.dial({
    callerId: outgoingNumber || DEFAULT_TWILIO_PHONE_NUMBER,
    timeLimit: 3600, // 1 hour max call time
    timeout: 30, // 30 seconds to answer
    answerOnBridge: true, // This enables two-way audio
    record: "record-from-answer", // Record the call from when it's answered
  });

  // Add phone number
  dial.number(
    {
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      statusCallback: "/api/twilio/call-status",
      statusCallbackMethod: "POST",
    },
    phoneNumber
  );

  return twiml.toString();
}

// Basic TwiML response for testing
function generateBasicTwiML() {
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say("Hello. This is a test call from your application.");
  return twiml.toString();
}

export async function POST(request: NextRequest) {
  try {
    console.log("[TwiML] Received POST request");

    // Try both URL parameters and form data
    const url = new URL(request.url);
    let to = url.searchParams.get("To");
    let outgoingNumber = url.searchParams.get("OutgoingNumber");

    // If not in URL, try to get from form data
    if (!to || !outgoingNumber) {
      try {
        const formData = await request.formData();
        to = to || (formData.get("To") as string);
        outgoingNumber =
          outgoingNumber || (formData.get("OutgoingNumber") as string);

        console.log("[TwiML] Got 'To' from form data:", to);
        if (outgoingNumber) {
          console.log(
            "[TwiML] Got 'OutgoingNumber' from form data:",
            outgoingNumber
          );
        }
      } catch (error) {
        console.log("[TwiML] Error parsing form data:", error);
      }
    } else {
      console.log("[TwiML] Got 'To' from URL params:", to);
      if (outgoingNumber) {
        console.log(
          "[TwiML] Got 'OutgoingNumber' from URL params:",
          outgoingNumber
        );
      }
    }

    if (!to) {
      console.log("[TwiML] No destination number found, using basic greeting");
      const twiml = new twilio.twiml.VoiceResponse();
      twiml.say("No destination number was provided for this call.");
      return new NextResponse(twiml.toString(), {
        headers: {
          "Content-Type": "text/xml",
          ...corsHeaders,
        },
      });
    }

    // Generate TwiML to connect the call
    const twiml = generateTwiML(to, outgoingNumber || undefined);
    console.log("[TwiML] Returning TwiML to connect to:", to);
    if (outgoingNumber) {
      console.log("[TwiML] Using custom outgoing number:", outgoingNumber);
    }

    // Return TwiML
    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("[TwiML] Error generating TwiML:", error);
    // Even on error, return a basic TwiML so Twilio doesn't error out
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say("Sorry, an error occurred while processing your call.");
    return new NextResponse(twiml.toString(), {
      headers: {
        "Content-Type": "text/xml",
        ...corsHeaders,
      },
    });
  }
}

// Support GET requests as well for testing
export async function GET(request: NextRequest) {
  return POST(request);
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
