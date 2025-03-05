import { NextResponse, NextRequest } from "next/server";
import twilio from "twilio";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import rateLimit from "@/lib/rate-limit";

// Create a rate limiter (5 requests per minute per IP)
const tokenLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per interval
  tokensPerInterval: 5, // 5 requests per interval
});

// More restrictive CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin":
    process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com", // Only allow your domain
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Map to store tokens by user ID (for server-side use only)
// In production, you'd use a more persistent and secure storage
const userTokenCache = new Map<
  string,
  {
    token: string;
    expiry: number;
  }
>();

/**
 * Generates a token for a user but does NOT return it
 * Instead, it stores the token server-side for use by other endpoints
 */
export async function POST(request: NextRequest) {
  try {
    console.log("Token generation endpoint called");

    // Apply rate limiting based on IP
    const ip = request.ip || "anonymous";
    try {
      await tokenLimiter.check(5, ip);
    } catch (error) {
      console.error("Rate limit exceeded for IP:", ip);
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: corsHeaders }
      );
    }

    // Initialize Supabase client
    const supabase = createServerComponentClient({ cookies });

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      console.error("Unauthorized token request - no session");
      return NextResponse.json(
        { error: "Unauthorized - Authentication required" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Get user ID from authenticated user
    const userId = session.user.id;
    console.log("Authenticated user ID:", userId);

    // Check if Twilio credentials are set
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKey = process.env.TWILIO_API_KEY;
    const apiSecret = process.env.TWILIO_API_SECRET;
    const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;

    if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
      console.error("Missing Twilio credentials");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500, headers: corsHeaders }
      );
    }

    try {
      // Generate the token
      const AccessToken = twilio.jwt.AccessToken;
      const VoiceGrant = AccessToken.VoiceGrant;

      // Create Voice grant
      const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: twimlAppSid,
        incomingAllow: true,
      });

      // Create token with 15-minute TTL
      const token = new AccessToken(accountSid, apiKey, apiSecret, {
        identity: userId,
        ttl: 900, // 15 minutes
      });

      // Add the voice grant
      token.addGrant(voiceGrant);

      // Generate the token string
      const tokenString = token.toJwt();
      console.log("Token generated successfully for user:", userId);

      // Store token in server-side cache
      userTokenCache.set(userId, {
        token: tokenString,
        expiry: Date.now() + 900 * 1000, // 15 minutes in ms
      });

      // Return success but WITHOUT the token
      return NextResponse.json(
        {
          success: true,
          message: "Twilio capabilities initialized",
          // No token is returned to the client
        },
        { headers: corsHeaders }
      );
    } catch (tokenError: any) {
      console.error("Error creating token:", tokenError);

      let errorMessage = "Failed to initialize Twilio capabilities";

      return NextResponse.json(
        { error: errorMessage },
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error: any) {
    console.error("Error in token endpoint:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Export the token getter for other server components to use
export function getTokenForUser(userId: string): string | null {
  const cachedData = userTokenCache.get(userId);

  // If no token or token expired, return null
  if (!cachedData || cachedData.expiry < Date.now()) {
    return null;
  }

  return cachedData.token;
}
