import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/lib/database.types";

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Check users table
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, credit_balance")
      .limit(1);

    if (usersError) {
      return NextResponse.json(
        {
          status: "error",
          table: "users",
          error: usersError,
        },
        { status: 500 }
      );
    }

    // Check transactions table
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("id, user_id, payment_intent_id")
      .limit(1);

    if (transactionsError) {
      return NextResponse.json(
        {
          status: "error",
          table: "transactions",
          error: transactionsError,
        },
        { status: 500 }
      );
    }

    // Check call_logs table
    const { data: callLogs, error: callLogsError } = await supabase
      .from("call_logs")
      .select("id, user_id, call_sid")
      .limit(1);

    if (callLogsError) {
      return NextResponse.json(
        {
          status: "error",
          table: "call_logs",
          error: callLogsError,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "All tables verified successfully",
      tables: {
        users: { exists: true, sample: users },
        transactions: { exists: true, sample: transactions },
        call_logs: { exists: true, sample: callLogs },
      },
    });
  } catch (error) {
    console.error("Error verifying tables:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
