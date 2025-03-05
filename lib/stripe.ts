import Stripe from "stripe";

// Credit package configuration
export const CREDIT_PACKAGES = [
  { id: "credit-5", name: "$5 Credit Package", amount: 5, credits: 5 },
  { id: "credit-10", name: "$10 Credit Package", amount: 10, credits: 10 },
  { id: "credit-20", name: "$20 Credit Package", amount: 20, credits: 20 },
  { id: "credit-50", name: "$50 Credit Package", amount: 50, credits: 50 },
  { id: "credit-100", name: "$100 Credit Package", amount: 100, credits: 100 },
];

// Cost per minute for calls
export const COST_PER_MINUTE = 0.15; // Original rate: 0.15 credits per minute

// Only initialize Stripe on the server side
let stripe: Stripe | null = null;

// This function ensures we only access the Stripe instance on the server
export const getStripe = () => {
  if (typeof window !== "undefined") {
    // We're on the client side, don't try to initialize Stripe with the secret key
    console.warn("Attempted to initialize Stripe on the client side");
    return null;
  }

  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Missing Stripe secret key in environment variables");
      return null;
    }

    // Validate the Stripe key format (it should start with sk_)
    if (!process.env.STRIPE_SECRET_KEY.startsWith("sk_")) {
      console.error(
        "Invalid Stripe secret key format. Key should start with 'sk_'"
      );
      return null;
    }

    try {
      stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16" as Stripe.LatestApiVersion, // Use the latest API version
      });
      console.log("Stripe initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Stripe:", error);
      return null;
    }
  }

  return stripe;
};

// Create a Stripe Checkout session
export async function createCheckoutSession(
  packageId: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
) {
  const stripe = getStripe();

  if (!stripe) {
    throw new Error("Stripe can only be accessed on the server side");
  }

  const creditPackage = CREDIT_PACKAGES.find((pkg) => pkg.id === packageId);

  if (!creditPackage) {
    throw new Error("Invalid credit package");
  }

  try {
    console.log(
      `Creating checkout session for package ${packageId} for user ${userId}`
    );
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: creditPackage.name,
              description: `${creditPackage.credits} credits for your account`,
            },
            unit_amount: creditPackage.amount * 100, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        packageId,
        creditsToAdd: creditPackage.credits.toString(),
      },
    });

    console.log(`Checkout session created with ID: ${session.id}`);
    console.log(`Session metadata:`, session.metadata);

    return session;
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error);
    throw new Error(
      `Failed to create checkout session: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Verify a payment was successful
export async function verifyPayment(paymentIntentId: string) {
  const stripe = getStripe();

  if (!stripe) {
    throw new Error("Stripe can only be accessed on the server side");
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent.status === "succeeded";
  } catch (error) {
    console.error("Error verifying payment:", error);
    throw new Error(
      `Failed to verify payment: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
