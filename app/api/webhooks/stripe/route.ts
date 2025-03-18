import { NextRequest, NextResponse } from "next/server";
import { getStripe, addSubscriptionIdToUser } from "@/lib/stripe";
import Stripe from "stripe";

// This is your Stripe CLI webhook secret for testing your endpoint locally
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      console.error("Stripe configuration error");
      return NextResponse.json(
        { error: "Stripe configuration error" },
        { status: 500 }
      );
    }

    const sig = request.headers.get("stripe-signature");

    if (!sig || !webhookSecret) {
      return NextResponse.json(
        { error: "Missing signature or webhook secret" },
        { status: 400 }
      );
    }

    // Get the raw body from the request
    const body = await request.text();

    // Verify the event is from Stripe
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the event
    console.log(`Webhook received: ${event.type}`);

    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(
          event.data.object as Stripe.Subscription
        );
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handler for subscription created events
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    console.log(`Subscription created: ${subscription.id}`);

    // Get the customer ID
    const customerId = subscription.customer as string;

    // Get metadata from the subscription to identify the user
    const userId = findUserIdFromSubscription(subscription);

    if (userId) {
      // Save the subscription ID to the user's account
      await addSubscriptionIdToUser(userId, subscription.id);
    } else {
      console.warn(`Could not find userId for subscription ${subscription.id}`);
    }
  } catch (error) {
    console.error("Error handling subscription created:", error);
  }
}

// Handler for subscription updated events
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    console.log(`Subscription updated: ${subscription.id}`);

    // Handle status changes, etc. if needed
  } catch (error) {
    console.error("Error handling subscription updated:", error);
  }
}

// Handler for subscription deleted events
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    console.log(`Subscription deleted: ${subscription.id}`);

    // Handle subscription cancellation if needed
    // This could involve updating the user's access or sending notifications
  } catch (error) {
    console.error("Error handling subscription deleted:", error);
  }
}

// Handler for successful invoice payments
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log(`Invoice payment succeeded: ${invoice.id}`);

    if (invoice.subscription) {
      // Handle subscription renewal if needed
      console.log(`Related to subscription: ${invoice.subscription}`);
    }
  } catch (error) {
    console.error("Error handling invoice payment succeeded:", error);
  }
}

// Handler for failed invoice payments
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log(`Invoice payment failed: ${invoice.id}`);

    if (invoice.subscription) {
      // Handle subscription payment failure
      console.log(`Related to subscription: ${invoice.subscription}`);
      // You might want to notify the user or take other actions
    }
  } catch (error) {
    console.error("Error handling invoice payment failed:", error);
  }
}

// Helper to find user ID from subscription
function findUserIdFromSubscription(
  subscription: Stripe.Subscription
): string | null {
  // Try to get the userId from metadata
  if (subscription.metadata?.userId) {
    return subscription.metadata.userId;
  }

  // If not available directly, check the latest invoice
  // This would require additional API calls to Stripe

  return null;
}
