import { NextResponse } from "next/server";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Allow all origins for now
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: Request) {
  console.log("Basic test API route called");
  console.log("Request URL:", request.url);

  return NextResponse.json(
    {
      success: true,
      message: "API is working",
      timestamp: new Date().toISOString(),
      url: request.url,
    },
    { headers: corsHeaders }
  );
}
