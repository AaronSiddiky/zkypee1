import { NextResponse } from "next/server";
import twilio from "twilio";

// Initialize Twilio client with your credentials
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function GET() {
  try {
    // Instead of fetching all countries, we'll just return the US
    const usCountry = {
      countryCode: "US",
      countryName: "United States",
      flagUrl: "https://flagcdn.com/us.svg",
    };

    // Return an array with only the US
    return NextResponse.json([usCountry]);
  } catch (error) {
    console.error("Error in countries endpoint:", error);
    return NextResponse.json(
      { error: "Failed to fetch countries" },
      { status: 500 }
    );
  }
}
