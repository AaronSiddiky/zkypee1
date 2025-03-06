import { NextRequest, NextResponse } from "next/server";
import { hasEnoughCredits } from "@/lib/credits";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/lib/database.types";
import { COST_PER_MINUTE } from "@/lib/stripe";

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

    // Try to get the user's credit balance
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("credit_balance")
      .eq("id", user.id)
      .maybeSingle(); // Use maybeSingle instead of single to handle no results

    let creditBalance = 0;

    // If user doesn't exist in the database, create them with default credits
    if (userError || !userData) {
      console.log("User not found in database, creating user record");
      
      // Create the user with default credits (5.00)
      const defaultCredits = 5.00;
      const { error: insertError } = await supabase
        .from("users")
        .insert([{ id: user.id, credit_balance: defaultCredits }]);
      
      if (insertError) {
        console.error("Error creating user record:", insertError);
        // Continue with default credits even if insert fails
      } else {
        console.log(`User created with default balance of ${defaultCredits}`);
        creditBalance = defaultCredits;
      }
    } else {
      creditBalance = userData?.credit_balance || 0;
    }
    
    const requiredCredits = durationMinutes * COST_PER_MINUTE;
    
    console.log(`Credit check for user ${user.id}:`);
    console.log(`- Current balance: ${creditBalance}`);
    console.log(`- Required credits: ${requiredCredits} (${durationMinutes} minutes at ${COST_PER_MINUTE}/min)`);
    console.log(`- Has enough credits: ${creditBalance >= requiredCredits}`);

    const enoughCredits = creditBalance >= requiredCredits;

    return NextResponse.json({ hasEnoughCredits: enoughCredits });
  } catch (error) {
    console.error("Error checking credits:", error);
    return NextResponse.json(
      { error: "Failed to check credits", hasEnoughCredits: false },
      { status: 500 }
    );
  }
}
