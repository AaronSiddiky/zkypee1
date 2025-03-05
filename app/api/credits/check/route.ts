import { NextRequest, NextResponse } from "next/server";
import { hasEnoughCredits } from "@/lib/credits";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/lib/database.types";

export async function POST(request: NextRequest) {
  try {
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
          { error: "Unauthorized - Invalid token", hasEnoughCredits: false },
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
        { error: "Authentication required", hasEnoughCredits: false },
        { status: 401 }
      );
    }

    console.log("User authenticated:", user.id);

    const body = await request.json();
    const { durationMinutes = 10 } = body;

    // Validate input
    if (!durationMinutes || durationMinutes <= 0) {
      return NextResponse.json(
        { error: "Invalid duration", hasEnoughCredits: false },
        { status: 400 }
      );
    }

    // Check if user has enough credits
    const enoughCredits = await hasEnoughCredits(user.id, durationMinutes);

    return NextResponse.json({ hasEnoughCredits: enoughCredits });
  } catch (error) {
    console.error("Error checking credits:", error);
    return NextResponse.json(
      { error: "Failed to check credits", hasEnoughCredits: false },
      { status: 500 }
    );
  }
}
