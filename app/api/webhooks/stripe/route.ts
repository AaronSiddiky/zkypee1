import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { convertReferral } from "@/lib/referrals";

// This is your Stripe CLI webhook secret for testing your endpoint locally
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const supabase = createRouteHandlerClient({ cookies });
  const customerId = subscription.customer as string;

  // Get the customer to find their email
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return;  // Handle deleted customers
  const email = customer.email;

  if (!email) return;

  // Find user by email
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (!userData) return;

  // Update user's subscription status
  await supabase
    .from('users')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
    })
    .eq('id', userData.id);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  await supabase
    .from('users')
    .update({
      subscription_status: subscription.status,
    })
    .eq('stripe_customer_id', customerId);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  await supabase
    .from('users')
    .update({
      subscription_status: 'canceled',
      stripe_subscription_id: null
    })
    .eq('stripe_customer_id', customerId);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (typeof invoice.customer === 'string') {
    await supabase
      .from('users')
      .update({
        subscription_status: 'active'
      })
      .eq('stripe_customer_id', invoice.customer);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (typeof invoice.customer === 'string') {
    await supabase
      .from('users')
      .update({
        subscription_status: 'past_due'
      })
      .eq('stripe_customer_id', invoice.customer);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'payment_intent.succeeded':
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
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}