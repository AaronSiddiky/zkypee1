import { NextResponse, NextRequest } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { corsHeaders } from "@/lib/cors";

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });

    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        token: session.access_token,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Error in token endpoint:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
