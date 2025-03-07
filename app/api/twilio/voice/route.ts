import { NextResponse } from "next/server";
import twilio from "twilio";
import { corsHeaders } from "@/lib/cors";

const VoiceResponse = twilio.twiml.VoiceResponse;

// Handle TwiML for voice applications
export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const toValue = data.get("To");
    const to = toValue?.toString() || "";
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
      "https://zkypee.com";

    const twiml = new VoiceResponse();

    // If the request is from a browser client
    if (to) {
      // Create a <Dial> verb to connect to the phone number
      const dial = twiml.dial({
        callerId: process.env.TWILIO_PHONE_NUMBER,
        answerOnBridge: true,
        record: "record-from-answer",
        timeout: 30,
        action: `${baseUrl}/api/twilio/call-status`,
        method: "POST",
      });

      // Add the number to dial with status callbacks
      dial.number(
        {
          statusCallbackEvent: [
            "initiated",
            "ringing",
            "answered",
            "completed",
          ],
          statusCallback: `${baseUrl}/api/twilio/call-status`,
          statusCallbackMethod: "POST",
        },
        to
      );
    } else {
      twiml.say("No destination number provided.");
    }

    // Return the TwiML as XML with CORS headers
    return new NextResponse(twiml.toString(), {
      headers: {
        "Content-Type": "text/xml",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error generating TwiML:", error);
    const twiml = new VoiceResponse();
    twiml.say("An error occurred while processing your call.");
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
