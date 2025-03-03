import { NextResponse } from "next/server";
import twilio from "twilio";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    console.log("Voice API route called - SIMPLIFIED");

    // Create a simple TwiML response
    const twiml = new twilio.twiml.VoiceResponse();

    // Get form data with minimal processing
    const formData = await request.formData();
    const To = formData.get("To") as string;

    if (To) {
      console.log(`Dialing number: ${To}`);

      // Get the Twilio phone number from env
      const twilioPhoneNumber =
        process.env.TWILIO_PHONE_NUMBER || "+18574129969";

      // Create a simple dial instruction
      const dial = twiml.dial({
        callerId: twilioPhoneNumber,
        timeout: 20,
      });

      // Format the number if needed
      let formattedNumber = To;
      if (!To.startsWith("+")) {
        formattedNumber = `+1${To}`;
      }

      // Add the number to dial
      dial.number(formattedNumber);
    } else {
      // Simple response if no number provided
      twiml.say("Thanks for calling!");
    }

    // Generate the TwiML response
    const twimlString = twiml.toString();
    console.log("TwiML response:", twimlString);

    // Return the response immediately
    return new NextResponse(twimlString, {
      headers: {
        "Content-Type": "text/xml",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error in voice route:", error);

    // Create a simple error response
    const errorTwiml = new twilio.twiml.VoiceResponse();
    errorTwiml.say("An error occurred with your call.");

    return new NextResponse(errorTwiml.toString(), {
      headers: {
        "Content-Type": "text/xml",
        ...corsHeaders,
      },
    });
  }
}
