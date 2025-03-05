import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession, CREDIT_PACKAGES } from "@/lib/stripe";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/lib/database.types";

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Check if user is authenticated via session
    const {
      data: { session: authSession },
    } = await supabase.auth.getSession();

    // If no session, check for Authorization header
    if (!authSession) {
      const authHeader = request.headers.get("Authorization");

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Extract the token
      const token = authHeader.split(" ")[1];

      // Verify the token
      const {
        data: { user },
      } = await supabase.auth.getUser(token);

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Continue with the authenticated user
      const userId = user.id;
      const body = await request.json();
      const { packageId } = body;

      // Validate package ID
      const creditPackage = CREDIT_PACKAGES.find((pkg) => pkg.id === packageId);
      if (!creditPackage) {
        return NextResponse.json(
          { error: "Invalid package ID" },
          { status: 400 }
        );
      }

      // Create success and cancel URLs
      const origin = request.headers.get("origin") || "http://localhost:3000";
      const successUrl = `${origin}/credits/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${origin}/credits/cancel`;

      try {
        // Create Stripe checkout session
        const checkoutSession = await createCheckoutSession(
          packageId,
          userId,
          successUrl,
          cancelUrl
        );

        // Verify that metadata is correctly set
        if (
          !checkoutSession.metadata ||
          !checkoutSession.metadata.userId ||
          !checkoutSession.metadata.packageId ||
          !checkoutSession.metadata.creditsToAdd
        ) {
          console.error(
            "Failed to set metadata properly in checkout session:",
            checkoutSession
          );
          return NextResponse.json(
            { error: "Failed to create checkout session with proper metadata" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          sessionId: checkoutSession.id,
          url: checkoutSession.url,
        });
      } catch (stripeError) {
        console.error("Stripe error:", stripeError);
        return NextResponse.json(
          { error: "Failed to create Stripe checkout session" },
          { status: 500 }
        );
      }
    }

    // If we have a session, proceed with that
    const userId = authSession.user.id;
    const body = await request.json();
    const { packageId } = body;

    // Validate package ID
    const creditPackage = CREDIT_PACKAGES.find((pkg) => pkg.id === packageId);
    if (!creditPackage) {
      return NextResponse.json(
        { error: "Invalid package ID" },
        { status: 400 }
      );
    }

    // Create success and cancel URLs
    const origin = request.headers.get("origin") || "http://localhost:3000";
    const successUrl = `${origin}/credits/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/credits/cancel`;

    try {
      // Create Stripe checkout session
      const checkoutSession = await createCheckoutSession(
        packageId,
        userId,
        successUrl,
        cancelUrl
      );

      // Verify that metadata is correctly set
      if (
        !checkoutSession.metadata ||
        !checkoutSession.metadata.userId ||
        !checkoutSession.metadata.packageId ||
        !checkoutSession.metadata.creditsToAdd
      ) {
        console.error(
          "Failed to set metadata properly in checkout session:",
          checkoutSession
        );
        return NextResponse.json(
          { error: "Failed to create checkout session with proper metadata" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
      });
    } catch (stripeError) {
      console.error("Stripe error:", stripeError);
      return NextResponse.json(
        { error: "Failed to create Stripe checkout session" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
