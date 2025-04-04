import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  try {
    console.log('Webhook called');
    const headersList = headers();
    console.log('Headers:', Object.fromEntries(headersList.entries()));
    
    // Log the incoming data
    const text = await req.text();
    console.log('Webhook payload:', text);

    // Just acknowledge receipt - we'll fetch messages directly from Twilio API
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error in webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// Endpoint to get messages for a specific number
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const number = searchParams.get('number');

  if (!number) {
    return NextResponse.json(
      { error: 'Phone number is required' },
      { status: 400 }
    );
  }

  // Get messages for the number
  const numberMessages = getMessages(number);
  
  // Sort messages by timestamp in descending order (newest first)
  return NextResponse.json(
    numberMessages.sort((a: Message, b: Message) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  );
} 