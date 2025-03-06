import { NextRequest, NextResponse } from "next/server";
import { RateService } from "@/lib/rates/RateService";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * API endpoint to look up call rates by country code or phone number
 * GET /api/rates/lookup?number=+12345678901
 */
export async function GET(request: NextRequest) {
  try {
    // Initialize rate service
    const rateService = RateService.getInstance();
    await rateService.initialize();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const phoneNumber = searchParams.get("number");

    // Validate input
    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number or country code is required" },
        { status: 400 }
      );
    }

    // Get rate information
    const rateInfo = rateService.getRateByNumber(phoneNumber);

    // Check if authenticated to include more detailed information
    const cookieStore = cookies();
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // If authenticated, include estimated call duration based on user's credits
    if (session?.user) {
      const { data: userData } = await supabase
        .from("users")
        .select("credit_balance")
        .eq("id", session.user.id)
        .single();

      if (userData?.credit_balance) {
        const creditBalance = parseFloat(userData.credit_balance);
        const potentialDuration = rateService.calculatePotentialDuration(
          rateInfo.rate,
          creditBalance
        );

        return NextResponse.json({
          ...rateInfo,
          estimatedMinutes: potentialDuration,
          formattedRate: rateService.formatRateDisplay(rateInfo.rate),
          creditBalance,
        });
      }
    }

    // Return basic rate information for unauthenticated users
    return NextResponse.json({
      ...rateInfo,
      formattedRate: rateService.formatRateDisplay(rateInfo.rate),
    });
  } catch (error) {
    console.error("Error in rate lookup:", error);
    return NextResponse.json(
      { error: "Failed to lookup rate information" },
      { status: 500 }
    );
  }
}
