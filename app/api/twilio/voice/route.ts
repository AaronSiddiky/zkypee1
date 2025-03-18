import { NextResponse } from "next/server";
import twilio from "twilio";
import { corsHeaders } from "@/lib/cors";
import { DEFAULT_TWILIO_PHONE_NUMBER } from "../phone-number";

const VoiceResponse = twilio.twiml.VoiceResponse;

// Handle TwiML for voice applications
export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const toValue = data.get("To");
    const to = toValue?.toString() || "";

    // Extract OutgoingNumber from formData if available
    const outgoingNumberValue = data.get("OutgoingNumber");
    const outgoingNumber =
      outgoingNumberValue?.toString() || DEFAULT_TWILIO_PHONE_NUMBER;

    // Log the received parameters for debugging
    console.log("[Voice TwiML] To:", to);
    console.log("[Voice TwiML] OutgoingNumber:", outgoingNumber);

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";

    const twiml = new VoiceResponse();

    // If the request is from a browser client
    if (to) {
      // Create a <Dial> verb to connect to the phone number
      const dial = twiml.dial({
        callerId: outgoingNumber, // Use the extracted outgoing number instead of hardcoded value
        answerOnBridge: true,
        record: "record-from-answer",
        timeout: 30,
        action: `${protocol}://${host}/api/twilio/call-status`,
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
          statusCallback: `${protocol}://${host}/api/twilio/call-status`,
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
