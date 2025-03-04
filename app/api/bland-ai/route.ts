import { NextResponse } from 'next/server';
import twilio from 'twilio';

// Get BlandAI API key from environment variables
const BLAND_AI_API_KEY = process.env.BLAND_AI_API_KEY || 'org_ebcbb48571a993b5343441029d2eaf8e4a6df6cd1689b4d3a49cecb80fc236856032e14fcdda2533a58969';

// Initialize Twilio client using your existing credentials
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request: Request) {
  try {
    const { prompt, phoneNumber, voice = 'cailee' } = await request.json();
    
    console.log('Received request with:', { prompt, phoneNumber });
    
    if (!prompt || !phoneNumber) {
      console.log('Missing parameters:', { prompt, phoneNumber });
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Format the phone number to ensure it has the country code
    let formattedPhoneNumber = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
      formattedPhoneNumber = `+1${phoneNumber}`; // Assuming US number
      console.log('Formatted phone number:', formattedPhoneNumber);
    }
    
    // Instead of using Twilio number, let BlandAI use its own number
    // This is the key change - we're removing the 'from' parameter
    // so BlandAI will use a number that's registered with your account
    
    console.log('Calling BlandAI API with:', {
      phone_number: formattedPhoneNumber,
      task: prompt,
      voice_id: voice
    });
    
    const response = await fetch('https://api.bland.ai/v1/calls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BLAND_AI_API_KEY}`
      },
      body: JSON.stringify({
        phone_number: formattedPhoneNumber,
        task: prompt,
        voice_id: voice,
        reduce_latency: true,
        wait_for_greeting: true,
        record: true,
      })
    });
    
    const responseText = await response.text();
    console.log('BlandAI API response status:', response.status);
    console.log('BlandAI API response text:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing BlandAI response:', e);
      return NextResponse.json(
        { error: 'Invalid response from BlandAI API', details: responseText },
        { status: 500 }
      );
    }
    
    if (!response.ok) {
      console.error('BlandAI API error:', data);
      return NextResponse.json(
        { 
          error: 'Failed to schedule call with BlandAI', 
          details: data,
          status: response.status 
        },
        { status: response.status }
      );
    }
    
    console.log('BlandAI call scheduled successfully:', data);
    
    // Use the number BlandAI is calling from (if provided in the response)
    const blandAINumber = data.from || "BlandAI's number";
    
    return NextResponse.json({
      success: true,
      callId: data.call_id,
      status: data.status,
      twilioNumber: blandAINumber
    });
    
  } catch (error) {
    console.error('Error scheduling BlandAI call:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Endpoint to get call status and results
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('callId');
    
    console.log('Fetching call status for callId:', callId);
    
    if (!callId) {
      return NextResponse.json(
        { error: 'Missing call ID' },
        { status: 400 }
      );
    }
    
    // Call the BlandAI API to get call status
    const response = await fetch(`https://api.bland.ai/v1/calls/${callId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BLAND_AI_API_KEY}`
      }
    });
    
    const responseText = await response.text();
    console.log('BlandAI status API response status:', response.status);
    console.log('BlandAI status API response text:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing BlandAI status response:', e);
      return NextResponse.json(
        { error: 'Invalid response from BlandAI API', details: responseText },
        { status: 500 }
      );
    }
    
    if (!response.ok) {
      console.error('BlandAI API error:', data);
      return NextResponse.json(
        { error: 'Failed to get call status from BlandAI', details: data },
        { status: response.status }
      );
    }
    
    // Extract the recording URL and transcript
    const recording = data.recording_url || null;
    const transcript = data.transcript || null;
    
    // Generate a summary if there's a transcript but no summary
    let summary = null;
    if (transcript && !data.summary) {
      // Simple summary extraction - in a real app, you might use an AI service for this
      summary = extractSummary(transcript);
    } else if (data.summary) {
      summary = data.summary;
    }
    
    return NextResponse.json({
      success: true,
      callId: data.call_id,
      status: data.status,
      recording: recording,
      transcript: transcript,
      summary: summary
    });
    
  } catch (error) {
    console.error('Error getting BlandAI call status:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Helper function to extract a simple summary from transcript
function extractSummary(transcript: string | null): string | null {
  if (!transcript) return null;
  
  // Very simple summary extraction - just the first few sentences
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return "No clear information extracted from call.";
  
  // Take up to 3 sentences for the summary
  return sentences.slice(0, 3).join('. ') + '.';
} 