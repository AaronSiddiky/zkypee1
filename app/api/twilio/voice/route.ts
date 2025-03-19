import { NextResponse } from "next/server";
import twilio from "twilio";
import { corsHeaders } from "@/lib/cors";
import { DEFAULT_TWILIO_PHONE_NUMBER } from "../phone-number-constants";

const VoiceResponse = twilio.twiml.VoiceResponse;

// Handle TwiML for voice applications
export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const toValue = data.get("To");
    const to = toValue?.toString() || "";

    // Extract OutgoingNumber from formData if available
    const outgoingNumberValue = data.get("OutgoingNumber");

    // Handle the case when outgoingNumberValue is an object
    let outgoingNumber = DEFAULT_TWILIO_PHONE_NUMBER;
    if (outgoingNumberValue) {
      if (typeof outgoingNumberValue === "object") {
        try {
          // Try to convert object to string representation
          const objString = JSON.stringify(outgoingNumberValue);
          console.log("[Voice TwiML] OutgoingNumber was object:", objString);
          // Extract phone number from object if it has a phoneNumber property
          const parsed = JSON.parse(objString);
          if (parsed && parsed.phoneNumber) {
            outgoingNumber = parsed.phoneNumber;
          }
        } catch (err) {
          console.error(
            "[Voice TwiML] Failed to parse OutgoingNumber object:",
            err
          );
        }
      } else {
        // Use the string value directly
        outgoingNumber = outgoingNumberValue.toString();
      }
    }

    // Log the received parameters for debugging
    console.log("[Voice TwiML] To:", to);
    console.log("[Voice TwiML] OutgoingNumber:", outgoingNumber);

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";

    // Final safety check to never use [object Object] as callerId
    if (
      !outgoingNumber ||
      outgoingNumber === "[object Object]" ||
      outgoingNumber.toString() === "[object Object]"
    ) {
      console.warn(
        "[Voice TwiML] Invalid outgoingNumber detected, using default instead:",
        outgoingNumber
      );
      outgoingNumber = DEFAULT_TWILIO_PHONE_NUMBER;
    }

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
