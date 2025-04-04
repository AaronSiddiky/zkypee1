import { NextResponse } from 'next/server';
import twilio from 'twilio';

interface Message {
  id: string;
  from: string;
  body: string;
  timestamp: string;
  status: string;
  error?: string;
}

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const number = searchParams.get('number');

  if (!number) {
    console.log('No phone number provided in request');
    return NextResponse.json(
      { error: 'Phone number is required' },
      { status: 400 }
    );
  }

  console.log('Attempting to fetch messages for number:', number);
  console.log('Using Twilio credentials:', {
    accountSid: process.env.TWILIO_ACCOUNT_SID?.slice(0, 5) + '...',
    hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN
  });
  
  try {
    // Fetch messages from Twilio API
    console.log('Making request to Twilio API...');
    const twilioMessages = await client.messages.list({
      to: number,
      limit: 100 // Get last 100 messages
    });

    console.log('Successfully received response from Twilio');
    console.log('Number of messages received:', twilioMessages.length);

    // Transform Twilio messages to our format
    const messages: Message[] = twilioMessages.map(msg => ({
      id: msg.sid,
      from: msg.from,
      body: msg.body,
      timestamp: new Date(msg.dateCreated).toISOString(),
      status: msg.status,
      error: msg.errorMessage || undefined
    }));

    // Sort messages by timestamp in descending order (newest first)
    const sortedMessages = messages.sort((a: Message, b: Message) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    console.log('Returning sorted messages:', sortedMessages.length);
    return NextResponse.json(sortedMessages);
  } catch (error: any) {
    console.error('Detailed Twilio API error:', {
      message: error.message,
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo
    });
    return NextResponse.json(
      { error: 'Failed to fetch messages', details: error.message },
      { status: 500 }
    );
  }
} 