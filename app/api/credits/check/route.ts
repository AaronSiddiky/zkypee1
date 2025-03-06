import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { RateService } from "@/lib/rates/RateService";
import { COST_PER_MINUTE } from "@/lib/stripe";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin":
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : process.env.NEXT_PUBLIC_SITE_URL || "",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    // Create a Supabase client
    const supabase = createServerComponentClient({ cookies });

    // Get the current session to identify the user
    const {
      data: { session },
    } = await supabase.auth.getSession();
    let currentUser = session?.user;

    // Also check the Authorization header for the token
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    // If we have a token in the Authorization header, verify it
    if (token) {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(token);
      if (!authError && user) {
        // Use this user instead of the session user
        currentUser = user;
      }
    }

    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be logged in to check credit information" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Get the phone number from query parameters
    const phoneNumber = request.nextUrl.searchParams.get("phoneNumber");
    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get the requested duration (default to 1 minute if not specified)
    const durationParam = request.nextUrl.searchParams.get("duration");
    const requestedDuration = durationParam ? parseInt(durationParam, 10) : 1;

    console.log(
      `[API:credits/check] Checking credits for ${requestedDuration} minutes`
    );

    // Clean and validate phone number
    const cleanedNumber = phoneNumber.replace(/[\s\(\)\-]/g, "");
    if (cleanedNumber.length < 4) {
      return NextResponse.json(
        {
          error: "Invalid phone number",
          details:
            "Phone number is too short. Please enter a complete phone number with country code.",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get user's credit balance directly from the database
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("credit_balance")
      .eq("id", currentUser.id)
      .single();

    console.log(
      `[API:credits/check] User credit balance: ${userData?.credit_balance}`
    );

    // Get rate information for the phone number
    const rateService = RateService.getInstance();
    await rateService.initialize();
    const rateInfo = rateService.getRateByNumber(cleanedNumber);

    // Use the found rate or fallback to default
    const rate = rateInfo.found ? rateInfo.rate : COST_PER_MINUTE;
    console.log(
      `[API:credits/check] Rate for ${cleanedNumber}: ${rate}/min (${
        rateInfo.country || "Unknown"
      })`
    );

    // Calculate estimated minutes
    const creditBalance = userData?.credit_balance ?? 0; // Use actual balance or default to 0 if not found
    const estimatedMinutes = rateService.calculatePotentialDuration(
      rate,
      creditBalance
    );
    const requiredCredits = rate * requestedDuration;
    const hasEnoughCredits = creditBalance >= requiredCredits;
    const isLowBalance = estimatedMinutes < 10;

    console.log(
      `[API:credits/check] Required credits: ${requiredCredits}, Has enough: ${hasEnoughCredits}`
    );

    const response = {
      hasEnoughCredits,
      currentBalance: creditBalance,
      ratePerMinute: rate,
      requestedDuration,
      requiredCredits,
      estimatedMinutes,
      callHistory: {
        totalCalls: 0,
        totalDuration: 0,
        averageDuration: 0,
      },
      country: rateInfo.country,
      countryCode: rateInfo.countryCode,
      isLowBalance,
    };

    console.log(`[API:credits/check] Response:`, response);

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error: any) {
    console.error("Error in credit check API:", error);
    return NextResponse.json(
      {
        error: "Failed to check credit information",
        details: error.message,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
