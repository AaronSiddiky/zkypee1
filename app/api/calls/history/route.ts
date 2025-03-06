import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getUserCallHistory } from "@/lib/credits";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin":
    process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * API route for fetching a user's call history
 * Supports pagination with limit and offset parameters
 */
export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client for authentication
    const supabase = createServerComponentClient({ cookies });

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      console.error("Unauthorized call history request - no session");
      return NextResponse.json(
        { error: "Unauthorized - Authentication required" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Get user ID
    const userId = session.user.id;

    // Parse pagination parameters from the URL
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Validate limit and offset
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid limit parameter. Must be between 1 and 100." },
        { status: 400, headers: corsHeaders }
      );
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: "Invalid offset parameter. Must be a positive number." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get the call history
    const callHistory = await getUserCallHistory(userId, limit, offset);

    // Format the calls with additional information
    const formattedCalls = callHistory.calls.map((call) => {
      // Calculate cost per minute if available
      const costPerMinute =
        call.duration_minutes > 0
          ? (call.credits_used / call.duration_minutes).toFixed(2)
          : "N/A";

      // Format the date
      const callDate = new Date(call.created_at).toLocaleString();

      return {
        ...call,
        costPerMinute,
        formattedDate: callDate,
        // Add any other formatting or calculations needed
      };
    });

    // Return the formatted call history
    return NextResponse.json(
      {
        calls: formattedCalls,
        total: callHistory.total,
        hasMore: callHistory.hasMore,
        limit,
        offset,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(callHistory.total / limit),
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Error in call history API:", error);

    return NextResponse.json(
      { error: `Failed to fetch call history: ${error.message}` },
      { status: 500, headers: corsHeaders }
    );
  }
}
