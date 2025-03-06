import { NextResponse, NextRequest } from "next/server";
import twilio from "twilio";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import rateLimit from "@/lib/rate-limit";
import { storeTokenForUser } from "@/lib/twilio-token";

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
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    // Check authentication from cookies first
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // If no session from cookies, try to get it from the Authorization header
    let userId = session?.user?.id;
    
    if (!userId) {
      // Try to get token from Authorization header
      const authHeader = request.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        
        // Verify the token
        try {
          const { data: userData } = await supabase.auth.getUser(token);
          userId = userData?.user?.id;
          console.log("User authenticated from Authorization header:", userId);
        } catch (verifyError) {
          console.error("Error verifying token from header:", verifyError);
        }
      }
    } else {
      console.log("User authenticated from session cookie:", userId);
    }

    // If still no user ID, return unauthorized
    if (!userId) {
      console.error("Unauthorized token request - no valid session");
      return NextResponse.json(
        { error: "Unauthorized - Authentication required" },
        { status: 401, headers: corsHeaders }
      );
    }

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

      // Store token in server-side cache using the utility function
      storeTokenForUser(userId, tokenString, 900 * 1000); // 15 minutes in ms

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
