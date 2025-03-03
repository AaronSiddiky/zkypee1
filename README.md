# Zkypee - Browser-based Phone Dialer

A web-based phone dialer application that allows you to make calls to any phone number in the world directly from your browser using WebRTC technology powered by Twilio.

## Features

- Make calls to any phone number worldwide
- Clean and intuitive dialer interface
- User authentication via Supabase
- Real-time call status updates

## Setup Instructions

### 1. Twilio Setup

1. Create a Twilio account at [twilio.com](https://www.twilio.com)
2. Get your Twilio Account SID and Auth Token from the Twilio Console
3. Buy a Twilio phone number with voice capabilities
4. Create a Twilio API Key and Secret from the Twilio Console (Account > API Keys)
5. Create a TwiML App:
   - Navigate to Programmable Voice > TwiML > TwiML Apps
   - Click "Create new TwiML App"
   - Give it a friendly name (e.g., "Zkypee Dialer")
   - For the Voice Request URL, enter your deployed app's URL followed by `/api/twilio/voice` (e.g., `https://your-app-url.com/api/twilio/voice`)
   - Save the TwiML App
   - Copy the TwiML App SID

### 2. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
TWILIO_API_KEY=your_api_key
TWILIO_API_SECRET=your_api_secret
TWILIO_TWIML_APP_SID=your_twiml_app_sid
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

## Usage

1. Navigate to the application in your browser
2. Sign in with your Supabase account
3. Enter a phone number in the dialer
4. Click the call button to initiate the call

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- Twilio Client SDK
- Supabase Authentication
- Framer Motion
