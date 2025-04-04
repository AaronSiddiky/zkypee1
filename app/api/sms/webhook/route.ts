import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import twilio from 'twilio';

// Define the Message interface to match the one in messages/route.ts
interface Message {
  id: string;
  from: string;
  body: string;
  timestamp: string;
  status: string;
  error?: string;
}

// In-memory message storage for demo purposes
// In a real application, you would use a database
const messageStore: Record<string, Message[]> = {};

// Function to get messages for a specific number
function getMessages(number: string): Message[] {
  return messageStore[number] || [];
}

// Function to store a new message
function storeMessage(number: string, message: Message): void {
  if (!messageStore[number]) {
    messageStore[number] = [];
  }
  messageStore[number].push(message);
  console.log(`📱 Stored new message for ${number}. Total: ${messageStore[number].length}`);
}

export async function POST(req: Request) {
  try {
    console.log('📩 SMS Webhook called');
    const headersList = headers();
    console.log('Headers:', Object.fromEntries(headersList.entries()));
    
    // Parse form data from Twilio
    const formData = await req.formData();
    const formDataObj = Object.fromEntries(formData.entries());
    console.log('Webhook payload:', formDataObj);

    // Extract relevant SMS data
    const messageId = formDataObj.MessageSid as string;
    const from = formDataObj.From as string;
    const to = formDataObj.To as string;
    const body = formDataObj.Body as string;
    const status = formDataObj.SmsStatus as string;

    if (messageId && from && to && body) {
      // Create a message object
      const message: Message = {
        id: messageId,
        from: from,
        body: body,
        timestamp: new Date().toISOString(),
        status: status || 'received'
      };

      // Store the message for the recipient number
      storeMessage(to, message);
      
      console.log(`📱 Received SMS from ${from} to ${to}: "${body.substring(0, 30)}${body.length > 30 ? '...' : ''}"`);
    } else {
      console.log('❌ Missing required SMS parameters in webhook payload');
    }

    // Return a TwiML response
    const twiml = new twilio.twiml.MessagingResponse();
    // You can add a reply message if needed
    // twiml.message('Auto-reply: Your message has been received');
    
    return new NextResponse(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('❌ Error in SMS webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// Endpoint to get messages for a specific number (fallback to local storage)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const number = searchParams.get('number');

  if (!number) {
    return NextResponse.json(
      { error: 'Phone number is required' },
      { status: 400 }
    );
  }

  console.log(`📱 Getting messages for ${number} from local store`);
  // Get messages for the number
  const numberMessages = getMessages(number);
  
  // Sort messages by timestamp in descending order (newest first)
  return NextResponse.json(
    numberMessages.sort((a: Message, b: Message) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  );
} 