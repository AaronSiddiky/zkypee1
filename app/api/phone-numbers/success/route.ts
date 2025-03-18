import { NextRequest, NextResponse } from "next/server";
import { getStripe, addSubscriptionIdToUser } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
  }

  try {
    // Get Stripe instance
    const stripe = getStripe();
    if (!stripe) {
      console.error("Stripe configuration error");
      return NextResponse.json(
        { error: "Stripe configuration error" },
        { status: 500 }
      );
    }

    // Retrieve the checkout session from Stripe
    console.log(`Retrieving Stripe session with ID: ${sessionId}`);
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

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
    const { userId, phoneNumber, friendlyName, type } =
      checkoutSession.metadata || {};

    if (!userId || !phoneNumber || type !== "phone_number_subscription") {
      console.error("Missing required metadata:", checkoutSession.metadata);
      return NextResponse.json(
        { error: "Missing required metadata" },
        { status: 400 }
      );
    }

    console.log(
      `Payment verified for phone number ${phoneNumber} for user ${userId}`
    );

    // Save the subscription ID if this is a subscription
    if (
      checkoutSession.mode === "subscription" &&
      checkoutSession.subscription
    ) {
      const subscriptionId =
        typeof checkoutSession.subscription === "string"
          ? checkoutSession.subscription
          : checkoutSession.subscription.id;

      console.log(
        `Saving subscription ID ${subscriptionId} for user ${userId}`
      );

      // Save the subscription ID to the user's stripe_subscription_ids
      await addSubscriptionIdToUser(userId, subscriptionId);
    }

    // CRITICAL STEP: Use the existing purchase endpoint to maintain the same database storage
    // This ensures the phone number is stored in Supabase exactly as it currently is
    console.log(
      `Forwarding to existing purchase endpoint to complete transaction`
    );

    const response = await fetch(
      new URL("/api/twilio/purchase-number", request.url).toString(),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber,
          friendlyName: friendlyName || `Phone number for ${userId}`,
          userId,
        }),
      }
    );

    // Get the response from the purchase endpoint
    const purchaseData = await response.json();

    if (!response.ok) {
      console.error(
        `Purchase endpoint returned error: ${response.status}`,
        purchaseData
      );
      return NextResponse.json(
        { error: purchaseData.error || "Failed to purchase number" },
        { status: response.status }
      );
    }

    console.log(`Phone number purchase successful:`, purchaseData);

    // Return success with the purchased number data
    return NextResponse.json({
      success: true,
      ...purchaseData,
      redirectTo: "/",
    });
  } catch (error) {
    console.error("Unexpected error in success route:", error);
    return NextResponse.json(
      { error: "Unexpected error processing payment" },
      { status: 500 }
    );
  }
}
