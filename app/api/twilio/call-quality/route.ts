import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";

// Call quality levels
enum CallQuality {
  UNKNOWN = "unknown",
  POOR = "poor",
  FAIR = "fair",
  GOOD = "good",
  EXCELLENT = "excellent",
}

export async function POST(request: NextRequest) {
  try {
    // Add CORS headers
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return NextResponse.json({}, { headers });
    }

    // Parse request data
    const data = await request.json();
    const { callSid } = data;

    if (!callSid) {
      return NextResponse.json(
        { error: "Call SID is required" },
        { status: 400, headers }
      );
    }

    // Get user session
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers }
      );
    }

    // Simulate call quality assessment
    // In a real implementation, you would check WebRTC stats or Twilio's call quality data
    // For this example, we'll return simulated quality data

    // Retrieve the call from the database to ensure it belongs to the user
    const { data: callData, error: callError } = await supabase
      .from("call_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("call_sid", callSid)
      .single();

    if (callError || !callData) {
      console.error("Error retrieving call data:", callError);
      // Don't expose detailed error to the client
      // Instead, simulate quality data anyway
    }

    // Simulate call quality (in a real application, this would be based on actual metrics)
    const qualityValues = [
      CallQuality.GOOD,
      CallQuality.EXCELLENT,
      CallQuality.FAIR,
      CallQuality.POOR,
    ];

    // Higher chance of good/excellent quality, lower chance of poor quality
    const weights = [0.45, 0.35, 0.15, 0.05];

    // Generate a random quality based on the weights
    const random = Math.random();
    let cumulativeProbability = 0;
    let quality = CallQuality.UNKNOWN;

    for (let i = 0; i < qualityValues.length; i++) {
      cumulativeProbability += weights[i];
      if (random <= cumulativeProbability) {
        quality = qualityValues[i];
        break;
      }
    }

    // Simulate network stats (these would be actual WebRTC stats in a real implementation)
    const stats = {
      quality,
      timestamp: new Date().toISOString(),
      metrics: {
        jitter: Math.random() * 30, // ms
        packetLoss: Math.random() * 2, // percentage
        roundTripTime: 50 + Math.random() * 100, // ms
        audioLevel: 0.5 + Math.random() * 0.5,
      },
    };

    // Return quality data with CORS headers
    return NextResponse.json(stats, { headers });
  } catch (error: any) {
    console.error("Error in call quality API:", error);

    return NextResponse.json(
      {
        error: "Failed to retrieve call quality",
        quality: CallQuality.UNKNOWN,
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}
