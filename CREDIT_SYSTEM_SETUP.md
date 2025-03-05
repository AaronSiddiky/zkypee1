# Credit System Setup Guide

This guide provides step-by-step instructions for setting up the credit system that allows users to add funds to their account via Stripe and use those credits for calls at a rate of $0.15 per minute.

## Prerequisites

- Stripe account (sign up at [stripe.com](https://stripe.com) if you don't have one)
- Supabase project (create one at [supabase.com](https://supabase.com) if you don't have one)
- Node.js and npm installed

## Step 1: Environment Setup

1. Update your `.env.local` file with your Stripe API keys:

```
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_test_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

Replace `sk_test_your_test_key_here` and `pk_test_your_publishable_key_here` with your actual Stripe API keys.

## Step 2: Database Schema Setup

1. Navigate to the SQL Editor in your Supabase dashboard.
2. Copy the contents of the `supabase/schema.sql` file.
3. Paste the SQL into the editor and run it to create the necessary tables and set up Row Level Security.

## Step 3: Testing the Credit System

### Testing Credit Purchase

1. Create a test user account in your application.
2. Navigate to the credits purchase page.
3. Select a credit package and proceed to checkout.
4. Use Stripe test card details for payment:
   - Card number: 4242 4242 4242 4242
   - Expiry date: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

### Testing Credit Deduction

1. Make a test call with the user account that has credits.
2. Verify that credits are deducted at the rate of $0.15 per minute.
3. Check the call logs to ensure the deduction was recorded correctly.

## API Endpoints

The credit system includes the following API endpoints:

- `POST /api/credits/checkout`: Creates a Stripe checkout session for purchasing credits.
- `GET /api/credits/success`: Handles successful payments and adds credits to the user's account.
- `GET /api/credits/balance`: Gets the user's current credit balance.
- `POST /api/credits/deduct`: Deducts credits after a call.

## Credit Packages

The system includes the following credit packages:

- $5 package (5 credits)
- $10 package (10 credits)
- $20 package (20 credits)
- $50 package (50 credits)
- $100 package (100 credits)

## Call Pricing

Calls are priced at $0.15 per minute, which means:

- 1 credit = $1
- 1 minute of call time = 0.15 credits

## Troubleshooting

### Common Issues

1. **Payment not processing**: Ensure you're using valid Stripe test card details and that your Stripe API keys are correctly set up.
2. **Credits not being added**: Check the Supabase logs for any errors in the transaction process.
3. **Credits not being deducted**: Verify that the call duration is being calculated correctly and that the user has sufficient credits.

### Logs and Debugging

- Check the browser console for client-side errors.
- Check the server logs for API endpoint errors.
- Check the Stripe dashboard for payment processing issues.
- Check the Supabase logs for database operation issues.

## Next Steps

After setting up the basic credit system, consider implementing:

1. Credit usage analytics for users
2. Auto-reload options for convenience
3. Volume discounts for larger credit purchases
4. Promotional credit campaigns
