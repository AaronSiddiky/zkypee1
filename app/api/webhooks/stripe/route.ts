import { NextRequest, NextResponse } from "next/server";
import { getStripe, addSubscriptionIdToUser } from "@/lib/stripe";
import Stripe from "stripe";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { convertReferral } from "@/lib/referrals";

// This is your Stripe CLI webhook secret for testing your endpoint locally
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const userId = paymentIntent.metadata.userId;

      if (!userId) {
        return NextResponse.json({ error: 'No user ID in payment intent' }, { status: 400 });
      }

      // Check if this is the user's first successful payment
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (!transactions || transactions.length === 0) {
        // This is the first transaction, check for referral
        const { data: referral } = await supabase
          .from('referrals')
          .select('referrer_id')
          .eq('referred_id', userId)
          .single();

        if (referral) {
          // Increment the referrer's total_referrals
          await supabase
            .from('users')
            .update({ total_referrals: supabase.rpc('increment') })
            .eq('id', referral.referrer_id);
        }
      }

      // Record the transaction
      await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          amount: paymentIntent.amount / 100,
          payment_intent_id: paymentIntent.id,
          status: 'succeeded'
        });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  // Implementation of handleSubscriptionCreated
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Implementation of handleSubscriptionUpdated
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Implementation of handleSubscriptionDeleted
}

export async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Implementation of handleInvoicePaymentSucceeded
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Implementation of handleInvoicePaymentFailed
}