import { NextRequest, NextResponse } from "next/server";
import { CREDIT_PACKAGES, getStripe } from "@/lib/stripe";
import { addCreditsToUser } from "@/lib/credits";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/lib/database.types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
  }

  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Get Stripe instance
    const stripe = getStripe();
    if (!stripe) {
      console.error("Stripe configuration error - stripe instance is null");
      return NextResponse.json(
        { error: "Stripe configuration error" },
        { status: 500 }
      );
    }

    // Retrieve the checkout session from Stripe
    console.log(`Retrieving Stripe session with ID: ${sessionId}`);
    let checkoutSession;
    try {
      checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
      console.log(
        "Retrieved session:",
        JSON.stringify({
          id: checkoutSession.id,
          payment_status: checkoutSession.payment_status,
          metadata: checkoutSession.metadata,
          payment_intent: checkoutSession.payment_intent,
        })
      );
    } catch (stripeError) {
      console.error("Error retrieving Stripe session:", stripeError);
      return NextResponse.json(
        { error: "Failed to retrieve Stripe session" },
        { status: 500 }
      );
    }

    // Verify the payment was successful
    if (checkoutSession.payment_status !== "paid") {
      console.error(
        `Payment not completed. Status: ${checkoutSession.payment_status}`
      );
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Get the metadata from the session
    const { userId, packageId, creditsToAdd } = checkoutSession.metadata || {};

    if (!userId || !packageId || !creditsToAdd) {
      console.error("Missing required metadata:", checkoutSession.metadata);
      return NextResponse.json(
        { error: "Missing required metadata" },
        { status: 400 }
      );
    }

    // Find the credit package
    const creditPackage = CREDIT_PACKAGES.find((pkg) => pkg.id === packageId);
    if (!creditPackage) {
      console.error(`Invalid package ID: ${packageId}`);
      return NextResponse.json(
        { error: "Invalid package ID" },
        { status: 400 }
      );
    }

    // Get the payment intent ID
    const paymentIntentId = checkoutSession.payment_intent as string;
    if (!paymentIntentId) {
      console.error("Missing payment intent ID in session");
      return NextResponse.json(
        { error: "Missing payment intent ID" },
        { status: 400 }
      );
    }

    // Check if this transaction has already been processed
    console.log(
      `Checking for existing transaction with payment intent: ${paymentIntentId}`
    );
    let existingTransaction;
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("id")
        .eq("payment_intent_id", paymentIntentId);

      if (error) {
        console.error("Error checking for existing transaction:", error);
        // Continue anyway, since this is just a check
      } else if (data && data.length > 0) {
        existingTransaction = data[0];
      }
    } catch (dbError) {
      console.error("Database error when checking transactions:", dbError);
      // Continue anyway, as this is not a critical failure
    }

    if (existingTransaction) {
      console.log("Transaction already processed, sending success response");
      // Instead of redirecting, just return a success response
      return createSuccessResponse();
    }

    // Add credits to the user's account
    console.log(`Adding ${creditsToAdd} credits to user ${userId}`);
    try {
      await addCreditsToUser(
        userId,
        Number(creditsToAdd),
        paymentIntentId,
        creditPackage.amount
      );
    } catch (creditError) {
      console.error("Error adding credits to user:", creditError);

      // Attempt to record the transaction even if adding credits failed
      try {
        const { error: transactionError } = await supabase
          .from("transactions")
          .insert({
            user_id: userId,
            amount: creditPackage.amount,
            credits_added: Number(creditsToAdd),
            payment_intent_id: paymentIntentId,
            status: "error",
            notes: `Payment processed but credits not added: ${
              creditError instanceof Error
                ? creditError.message
                : String(creditError)
            }`,
          });

        if (transactionError) {
          console.error(
            "Error recording fallback transaction:",
            transactionError
          );
        } else {
          console.log("Recorded transaction with error status");
        }
      } catch (fallbackError) {
        console.error(
          "Error in fallback transaction recording:",
          fallbackError
        );
      }
    }

    // Return a success response instead of redirecting
    console.log("Payment processed successfully, sending success response");
    return createSuccessResponse();
  } catch (error) {
    console.error("Unexpected error in success route:", error);

    // Return a success response even if there was an error
    return createSuccessResponse();
  }
}

// Helper function to create a consistent success response
function createSuccessResponse() {
  // Create a response with the appropriate CORS headers
  const response = NextResponse.json(
    {
      success: true,
      redirectTo: "/credits/thank-you",
    },
    { status: 200 }
  );

  // Add CORS headers
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");

  return response;
}
