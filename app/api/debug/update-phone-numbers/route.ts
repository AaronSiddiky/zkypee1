import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { corsHeaders } from "@/lib/cors";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { addPhoneNumberToUser } from "@/lib/phoneNumbers";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { userId, phoneNumber } = await request.json();

    if (!userId || !phoneNumber) {
      return NextResponse.json(
        { error: "User ID and phone number are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(
      `[DEBUG] Attempting to update phone numbers for user ${userId}`
    );

    // Create a server component client with explicit cookie store
    const cookieStore = cookies();
    const supabaseServer = createServerComponentClient({
      cookies: () => cookieStore,
    });

    console.log(`[DEBUG] User ID: ${userId}, Phone number: ${phoneNumber}`);

    // Use our updated function directly
    const success = await addPhoneNumberToUser(
      userId,
      phoneNumber,
      undefined, // No phone number details needed for debug
      supabaseServer
    );

    console.log(`[DEBUG] Update result: ${success ? "Success" : "Failure"}`);

    // Return results
    return NextResponse.json(
      {
        success,
        message: success
          ? "Successfully added phone number to user account"
          : "Failed to add phone number to user account, but it was recorded in the purchased_numbers table",
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("[DEBUG] Unexpected error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
