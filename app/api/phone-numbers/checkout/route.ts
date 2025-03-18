import { NextRequest, NextResponse } from "next/server";
import { createPhoneNumberCheckoutSession } from "@/lib/stripe";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/lib/database.types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, friendlyName, price, userId } = body;

    // Validate inputs
    if (!phoneNumber || !userId) {
      return NextResponse.json(
        { error: "Phone number and user ID are required" },
        { status: 400 }
      );
    }

    // Create success and cancel URLs
    const origin = request.headers.get("origin") || "http://localhost:3000";
    const successUrl = `${origin}/buy-number/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/buy-number/cancel`;

    // Create Stripe checkout session
    const checkoutSession = await createPhoneNumberCheckoutSession(
      phoneNumber,
      friendlyName || "Phone Number",
      price || 10, // Default price if not provided
      userId,
      successUrl,
      cancelUrl
    );

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
