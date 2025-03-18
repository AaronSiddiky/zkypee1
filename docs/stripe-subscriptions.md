# Stripe Subscriptions in Zkypee

This document explains how Stripe subscriptions are handled in Zkypee, particularly for phone number purchases.

## Overview

When a user purchases a phone number, they're subscribing to a monthly service. The subscription ID from Stripe is saved to the user's profile in the `stripe_subscription_ids` column, which stores an array of subscription IDs.

## Implementation Details

### Database Schema

The `users` table has a `stripe_subscription_ids` column of type `TEXT[]` which stores an array of Stripe subscription IDs associated with the user.

### Code Components

1. **Subscription Creation**: When a user purchases a phone number, a Stripe checkout session is created in `createPhoneNumberCheckoutSession()` in `lib/stripe.ts`.

2. **Success Handler**: After successful payment, the subscription ID is saved to the user's account in `app/api/phone-numbers/success/route.ts`.

3. **Webhook Handler**: A webhook handler in `app/api/webhooks/stripe/route.ts` processes Stripe events related to subscriptions (created, updated, deleted, payment succeeded/failed).

4. **User Data Storage**: The `addSubscriptionIdToUser()` function in `lib/stripe.ts` adds a subscription ID to the user's `stripe_subscription_ids` array.

## Setting Up Stripe Webhooks

To ensure proper handling of subscription events, you need to set up a Stripe webhook:

1. In the Stripe Dashboard, go to Developers > Webhooks
2. Add an endpoint with the URL: `https://your-domain.com/api/webhooks/stripe`
3. Select the following events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Get the webhook signing secret and add it to your environment variables as `STRIPE_WEBHOOK_SECRET`

### Testing Webhooks Locally

For local development, use the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will provide you with a webhook secret that you can add to your `.env.local` file.

## Subscription Management

Currently, the system saves subscription IDs but doesn't provide a user interface for managing subscriptions. Future enhancements could include:

1. Displaying active subscriptions to users
2. Allowing users to cancel subscriptions
3. Handling subscription upgrades/downgrades
4. Automated notifications for payment failures

## Troubleshooting

If subscription IDs aren't being saved:

1. Check that the Stripe checkout session has the correct metadata
2. Verify the success handler is being called correctly
3. Ensure the database schema includes the `stripe_subscription_ids` column
4. Check for errors in the console logs
