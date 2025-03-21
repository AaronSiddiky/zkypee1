import { NextResponse } from "next/server";
import twilio from "twilio";
import { DEFAULT_TWILIO_PHONE_NUMBER } from "../phone-number-constants";

// Initialize Twilio client using your existing credentials
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function GET() {
  try {
    // First try to use the default number
    const configuredPhoneNumber = DEFAULT_TWILIO_PHONE_NUMBER;
    if (configuredPhoneNumber) {
      return NextResponse.json({
        success: true,
        phoneNumber: configuredPhoneNumber,
        source: "config",
      });
    }

    // If no configured phone number, fall back to fetching from Twilio API
    const incomingPhoneNumbers = await twilioClient.incomingPhoneNumbers.list({
      limit: 1,
    });

    if (incomingPhoneNumbers.length > 0) {
      return NextResponse.json({
        success: true,
        phoneNumber: incomingPhoneNumbers[0].phoneNumber,
        source: "api",
      });
    } else {
      return NextResponse.json(
        { error: "No Twilio phone numbers found in your account" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error fetching Twilio phone number:", error);
    return NextResponse.json(
      { error: "Failed to retrieve Twilio phone number" },
      { status: 500 }
    );
  }
}
