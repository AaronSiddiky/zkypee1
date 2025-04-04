import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Use the existing Twilio phone number
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number not configured' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      phoneNumber,
      countryCode: 'US',
      available: true
    });
  } catch (error) {
    console.error('Error getting phone number:', error);
    return NextResponse.json(
      { error: 'Failed to get phone number' },
      { status: 500 }
    );
  }
} 