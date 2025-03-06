import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { corsHeaders } from "@/lib/cors";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });

    // Get user ID from query parameter
    const url = new URL(request.url);
    let userId = url.searchParams.get("userId");

    if (!userId) {
      // If no userId provided, try to get from session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        return NextResponse.json(
          { error: "No user ID provided and not authenticated" },
          { status: 401, headers: corsHeaders }
        );
      }

      userId = session.user.id;
    }

    console.log(`[DEBUG] Checking user ${userId}`);

    // Check public.users table
    const { data: publicUser, error: publicError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (publicError) {
      console.error("Error fetching public user:", publicError);
    }

    // Get transactions
    const { data: transactions, error: transactionError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (transactionError) {
      console.error("Error fetching transactions:", transactionError);
    }

    // Get call logs
    const { data: callLogs, error: callLogError } = await supabase
      .from("call_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (callLogError) {
      console.error("Error fetching call logs:", callLogError);
    }

    // Get auth user data from session if available
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const authUser = session?.user?.id === userId ? session.user : null;

    return NextResponse.json(
      {
        auth_user: authUser,
        public_user: publicUser,
        transactions: transactions || [],
        call_logs: callLogs || [],
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
