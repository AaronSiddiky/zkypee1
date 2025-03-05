import { NextRequest, NextResponse } from "next/server";
import { deductCreditsForCall } from "@/lib/credits";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/lib/database.types";

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Check if user is authenticated
    const {
      data: { session: authSession },
    } = await supabase.auth.getSession();
    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authSession.user.id;
    const body = await request.json();
    const { durationMinutes, callSid } = body;

    // Validate input
    if (!durationMinutes || !callSid) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Deduct credits for the call
    await deductCreditsForCall(userId, durationMinutes, callSid);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deducting credits:", error);

    // Handle insufficient credits error specifically
    if (error instanceof Error && error.message === "Insufficient credits") {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 } // Payment Required
      );
    }

    return NextResponse.json(
      { error: "Failed to deduct credits" },
      { status: 500 }
    );
  }
}
