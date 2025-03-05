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
    let tokenError = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      // Extract the token
      const token = authHeader.split(" ")[1];
      console.log("Token extracted, verifying...");

      // Check if token is empty or malformed
      if (!token || token === "undefined" || token === "null") {
        console.error("Invalid token format:", token);
        return NextResponse.json(
          { error: "Unauthorized - Invalid token format" },
          { status: 401 }
        );
      }

      // Verify the token
      const { data: userData, error } = await supabase.auth.getUser(token);
      tokenError = error;

      if (error) {
        console.error("Token verification error:", error);
        // Not returning error yet, we'll try session cookie as fallback
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

    // If still no user, return unauthorized with detailed message
    if (!user) {
      console.log("No authenticated user found");
      const errorDetails = tokenError ? ` (${tokenError.message})` : "";
      return NextResponse.json(
        { error: `You must be signed in to view credits${errorDetails}` },
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
        error:
          creditError instanceof Error
            ? creditError.message
            : String(creditError),
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
