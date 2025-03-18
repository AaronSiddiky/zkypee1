import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { supabaseAdmin } from "@/lib/supabase"; // Import the admin client
import { cookies } from "next/headers";
import { Database } from "@/lib/database.types";
import twilio from "twilio";

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { phoneNumber, subscriptionId, userId: requestUserId } = body;

    // Input validation
    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    // Initialize Supabase client for authentication checks
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });

    // Verify authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    // Get the userId, either from the session or fallback to request body in development
    let userId: string;

    if (session?.user?.id) {
      userId = session.user.id;
      console.log("Using authenticated user ID:", userId);
    } else if (process.env.NODE_ENV === "development" && requestUserId) {
      userId = requestUserId;
      console.log("Development mode: Using user ID from request:", userId);
    } else {
      console.log("No authenticated user found and no userId in request body");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get Stripe instance
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe configuration error" },
        { status: 500 }
      );
    }

    // Initialize Twilio client
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Step 1: Update the Supabase database using admin client (bypasses RLS)
    try {
      console.log(
        `Removing phone number ${phoneNumber} and subscription ${subscriptionId} from user ${userId}`
      );

      // Check if admin client is available
      if (!supabaseAdmin) {
        console.error("Supabase admin client not available");
        throw new Error("Admin client configuration error");
      }

      // First, fetch the current user data to get the arrays
      const { data: userData, error: fetchError } = await supabaseAdmin
        .from("users")
        .select("stripe_subscription_ids, purchased_phone_numbers")
        .eq("id", userId)
        .single();

      if (fetchError) {
        console.error(
          "Error fetching user data with admin client:",
          fetchError
        );
      } else if (userData) {
        console.log("Current user data:", userData);

        // Filter out the values we want to remove
        const currentPhoneNumbers = userData.purchased_phone_numbers || [];
        const currentSubscriptionIds = userData.stripe_subscription_ids || [];

        const updatedPhoneNumbers = currentPhoneNumbers.filter(
          (number: string) => number !== phoneNumber
        );

        const updatedSubscriptionIds = currentSubscriptionIds.filter(
          (id: string) => id !== subscriptionId
        );

        console.log("Updated arrays:", {
          phone_numbers: updatedPhoneNumbers,
          subscription_ids: updatedSubscriptionIds,
        });

        // Make sure we still have the admin client
        if (!supabaseAdmin) {
          throw new Error("Admin client lost during operation");
        }

        // Use the admin client to update the database
        const { error: updateError } = await supabaseAdmin
          .from("users")
          .update({
            purchased_phone_numbers: updatedPhoneNumbers,
            stripe_subscription_ids: updatedSubscriptionIds,
          })
          .eq("id", userId);

        if (updateError) {
          console.error("Error updating with admin client:", updateError);
        } else {
          console.log("Successfully updated the database with admin client");
        }
      } else {
        console.log("No user data found");
      }
    } catch (dbError) {
      console.error("Database operation error:", dbError);
    }

    // Step 2: Release the phone number from Twilio
    try {
      console.log(
        `Attempting to release phone number ${phoneNumber} from Twilio`
      );
      const incomingPhoneNumbers = await twilioClient.incomingPhoneNumbers.list(
        {
          phoneNumber: phoneNumber,
        }
      );

      if (incomingPhoneNumbers.length > 0) {
        const sid = incomingPhoneNumbers[0].sid;
        console.log(`Found phone number in Twilio with SID: ${sid}`);
        await twilioClient.incomingPhoneNumbers(sid).remove();
        console.log(
          `Successfully released phone number ${phoneNumber} from Twilio`
        );
      } else {
        console.log(`Phone number ${phoneNumber} not found in Twilio account`);
      }
    } catch (twilioError) {
      console.error("Error releasing phone number from Twilio:", twilioError);
    }

    // Step 3: Cancel the Stripe subscription
    try {
      await stripe.subscriptions.cancel(subscriptionId);
      console.log(`Subscription ${subscriptionId} canceled immediately`);
    } catch (stripeError) {
      console.error("Error canceling Stripe subscription:", stripeError);
    }

    return NextResponse.json({
      success: true,
      message: "Number removed successfully",
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
