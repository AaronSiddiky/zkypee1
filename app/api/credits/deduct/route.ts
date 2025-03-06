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
    const { durationMinutes, callSid, phoneNumber, rate, creditsToDeduct } =
      body;

    // Validate input
    if (!durationMinutes || !callSid || !rate || !creditsToDeduct) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("Processing credit deduction:", {
      userId,
      durationMinutes,
      callSid,
      phoneNumber,
      rate,
      creditsToDeduct,
    });

    // Get current user balance
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("credit_balance")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user balance:", userError);
      return NextResponse.json(
        { error: "Failed to fetch user balance" },
        { status: 500 }
      );
    }

    const currentBalance = parseFloat(userData.credit_balance);
    const newBalance = Math.max(0, currentBalance - creditsToDeduct);

    console.log("Credit calculation:", {
      currentBalance,
      creditsToDeduct,
      newBalance,
    });

    // Update user's balance
    const { error: updateError } = await supabase
      .from("users")
      .update({ credit_balance: newBalance })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating user balance:", updateError);
      return NextResponse.json(
        { error: "Failed to update credit balance" },
        { status: 500 }
      );
    }

    // Log the call
    const { error: logError } = await supabase.from("call_logs").insert({
      user_id: userId,
      call_sid: callSid,
      duration_minutes: durationMinutes,
      credits_used: creditsToDeduct,
      phone_number: phoneNumber,
      rate: rate,
      status: "completed",
    });

    if (logError) {
      console.error("Error logging call:", logError);
      // Don't fail the request if just the logging fails
    }

    return NextResponse.json({
      success: true,
      newBalance,
      creditsDeducted: creditsToDeduct,
      durationMinutes,
      callSid,
    });
  } catch (error) {
    console.error("Error deducting credits:", error);
    return NextResponse.json(
      { error: "Failed to deduct credits" },
      { status: 500 }
    );
  }
}
