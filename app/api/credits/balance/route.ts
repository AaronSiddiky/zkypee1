import { NextRequest, NextResponse } from "next/server";
import { getUserCreditBalance } from "@/lib/credits";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/lib/database.types";

export async function GET(request: NextRequest) {
  try {
    console.log("Credits balance API route called");

    // Create a Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });

    // Check for Authorization header first (this is what the dial page uses)
    const authHeader = request.headers.get("Authorization");
    console.log("Authorization header present:", !!authHeader);

    let user = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      // Extract the token
      const token = authHeader.split(" ")[1];
      console.log("Token extracted, verifying...");

      // Verify the token
      const { data: userData, error: tokenError } = await supabase.auth.getUser(
        token
      );

      if (tokenError) {
        console.error("Token verification error:", tokenError);
        return NextResponse.json(
          { error: "Unauthorized - Invalid token" },
          { status: 401 }
        );
      }

      if (userData?.user) {
        console.log("User verified from token:", userData.user.id);
        user = userData.user;
      } else {
        console.log("No user data returned from token verification");
      }
    }

    // If no user from token, try to get user from session cookie
    if (!user) {
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("Session data from cookie:", !!sessionData?.session);

      if (sessionData?.session?.user) {
        user = sessionData.session.user;
        console.log("User authenticated from session cookie:", user.id);
      }
    }

    // If still no user, return unauthorized
    if (!user) {
      console.log("No authenticated user found");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("User authenticated:", user.id);

    try {
      // Get the user's credit balance
      const creditBalance = await getUserCreditBalance(supabase, user.id);
      return NextResponse.json({ creditBalance });
    } catch (creditError) {
      console.error("Error fetching credit balance:", creditError);
      // Return a default credit balance of 0 if there was an error fetching it
      return NextResponse.json({
        creditBalance: 0,
        note: "Default balance returned due to error",
      });
    }
  } catch (error) {
    console.error("Error in credits balance API route:", error);
    return NextResponse.json(
      {
        error: `Error fetching user credit balance: ${
          error instanceof Error ? error.message : String(error)
        }`,
        creditBalance: 0,
      },
      { status: 200 } // Return 200 with a default balance to avoid breaking the client
    );
  }
}
