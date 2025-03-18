import { NextResponse, NextRequest } from "next/server";
import twilio from "twilio";
import { corsHeaders } from "@/lib/cors";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { SupabaseClient } from "@supabase/supabase-js";
import { addPhoneNumberToUser } from "@/lib/phoneNumbers";

// Define interfaces for better type safety
interface PurchasedPhoneNumber {
  number: string;
  sid: string;
  friendlyName: string;
  dateCreated: string;
  active: boolean;
  purchaseDate: string; // When the user purchased it
  capabilities?: {
    voice?: boolean;
    sms?: boolean;
    mms?: boolean;
  };
}

interface UserPhoneNumberData {
  purchased_phone_numbers?: string[];
}

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

// Function to retry a database operation with exponential backoff
async function retryDatabaseOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 300
): Promise<T> {
  let retries = 0;
  let delay = initialDelay;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        console.error(
          `Database operation failed after ${retries} retries:`,
          error
        );
        throw error;
      }
      console.log(`Retry ${retries} after ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}

// POST handler to purchase a number
export async function POST(request: NextRequest) {
  let supabase: SupabaseClient;
  let userId: string | null = null;
  let isAuthenticated = false;
  let userEmail = "user@example.com";

  try {
    console.log("[API:purchase-number] Starting purchase process");

    // Initialize Supabase client with explicit cookie store to ensure it works
    const cookieStore = cookies();
    supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });

    // Get the phone number, friendly name, and user ID from the request
    const {
      phoneNumber,
      friendlyName,
      userId: requestUserId,
      authToken,
    } = await request.json();
    console.log(
      `[API:purchase-number] Request to purchase ${phoneNumber}${
        requestUserId ? ` for user ${requestUserId}` : ""
      }`
    );

    // Validate inputs
    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // First, try to use the user ID from the request payload
    if (requestUserId) {
      userId = requestUserId;
      console.log(
        `[API:purchase-number] Using user ID from request: ${userId}`
      );
      isAuthenticated = true;
    }
    // If not provided, try to get from authenticated session
    else {
      console.log(
        `[API:purchase-number] No user ID in request, checking authentication`
      );
      let userData: UserPhoneNumberData | null = null;

      try {
        // Get the current user from Supabase (authentication check)
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error("[API:purchase-number] Auth error:", authError);
        }

        if (user) {
          isAuthenticated = true;
          userEmail = user.email || userEmail;
          userId = user.id;
          console.log(
            `[API:purchase-number] Authenticated as user ${userId} (${userEmail})`
          );

          // Get user data from the users table
          const { data, error } = await supabase
            .from("users")
            .select("purchased_phone_numbers")
            .eq("id", userId)
            .single();

          if (error) {
            console.error(
              "[API:purchase-number] Error fetching user data:",
              error
            );
            // Continue with null userData - we'll create a new array later
          } else if (data) {
            userData = data;
            console.log(
              `[API:purchase-number] Current phone numbers:`,
              userData.purchased_phone_numbers
            );
          }
        } else {
          console.log("[API:purchase-number] No authenticated user found");
        }
      } catch (authError) {
        console.error("[API:purchase-number] Auth error:", authError);
        // Continue to fallback auth check
      }

      // Fallback for development: check if we're in development environment
      if (!isAuthenticated) {
        const isDevelopment = process.env.NODE_ENV === "development";

        // In development, allow the request to proceed
        if (isDevelopment) {
          console.log(
            "[API:purchase-number] Development environment detected, bypassing authentication"
          );
          isAuthenticated = true;

          // If userId is still null in development mode but requestUserId was provided
          if (!userId && requestUserId) {
            userId = requestUserId;
            console.log(
              `[API:purchase-number] Using provided user ID in development mode: ${userId}`
            );
          } else if (!userId) {
            // Last resort: use a test user ID if none available
            userId = "00000000-0000-0000-0000-000000000000"; // Test user ID
            console.log(
              `[API:purchase-number] Using test user ID in development: ${userId}`
            );
          }
        }
      }

      if (!isAuthenticated) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401, headers: corsHeaders }
        );
      }
    }

    // Make sure we have a valid user ID before proceeding
    if (!userId) {
      console.error("[API:purchase-number] No valid user ID available");
      return NextResponse.json(
        { error: "User ID required but not available" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Purchase the number using Twilio API
    console.log(
      `[API:purchase-number] Attempting to purchase ${phoneNumber} via Twilio for user ${userId}`
    );

    let purchasedNumber;
    try {
      purchasedNumber = await client.incomingPhoneNumbers.create({
        phoneNumber: phoneNumber,
        friendlyName: friendlyName || `${userEmail}'s number`,
      });
      console.log(
        `[API:purchase-number] Successfully purchased ${phoneNumber}, SID: ${purchasedNumber.sid}`
      );
    } catch (twilioError: any) {
      console.error("[API:purchase-number] Twilio error:", twilioError);
      // Handle Twilio-specific error codes
      if (twilioError.code === 21404) {
        return NextResponse.json(
          {
            error: "Number not available",
            details: "This number is no longer available for purchase.",
          },
          { status: 400, headers: corsHeaders }
        );
      } else if (twilioError.code === 20003) {
        return NextResponse.json(
          {
            error: "Authentication failed",
            details: "Invalid Twilio credentials.",
          },
          { status: 401, headers: corsHeaders }
        );
      } else if (twilioError.code === 21218) {
        return NextResponse.json(
          {
            error: "Insufficient funds",
            details: "Your Twilio account does not have sufficient funds.",
          },
          { status: 402, headers: corsHeaders }
        );
      }

      throw twilioError; // Re-throw for generic error handling
    }

    // Store the purchased phone number in Supabase
    let updateSuccess = false;

    // Make sure we have a valid user ID at this point
    if (!userId) {
      console.error(
        "[API:purchase-number] No user ID available for database update"
      );
      return NextResponse.json(
        { error: "User ID required to save phone number" },
        { status: 400, headers: corsHeaders }
      );
    }

    try {
      console.log(
        `[API:purchase-number] Adding phone number to user account with userId: ${userId}`
      );

      // Re-initialize the server component client to ensure it's fresh
      const freshSupabase = createServerComponentClient({
        cookies: () => cookieStore,
      });

      // Use our updated function to add the phone number to the user's account
      updateSuccess = await addPhoneNumberToUser(
        userId,
        purchasedNumber.phoneNumber,
        {
          sid: purchasedNumber.sid,
          friendlyName: purchasedNumber.friendlyName,
          dateCreated: purchasedNumber.dateCreated.toString(),
          capabilities: {
            voice: purchasedNumber.capabilities?.voice || false,
            sms: purchasedNumber.capabilities?.sms || false,
            mms: purchasedNumber.capabilities?.mms || false,
          },
        },
        freshSupabase // Pass the fresh client
      );

      if (updateSuccess) {
        console.log(
          `[API:purchase-number] Successfully saved to user's account`
        );
      } else {
        console.error(
          `[API:purchase-number] Failed to save to user's account, but purchase was still recorded in the purchased_numbers table`
        );
      }
    } catch (dbError) {
      console.error("[API:purchase-number] Database error:", dbError);
      // We log this error but don't fail the request since the Twilio purchase succeeded
      console.error(
        `[CRITICAL] Phone number ${purchasedNumber.phoneNumber} (SID: ${purchasedNumber.sid}) purchased but not saved to user ${userId} record`
      );
    }

    // Return success response with the purchased number details and update status
    return NextResponse.json(
      {
        success: true,
        phoneNumber: purchasedNumber.phoneNumber,
        sid: purchasedNumber.sid,
        friendlyName: purchasedNumber.friendlyName,
        dateCreated: purchasedNumber.dateCreated,
        capabilities: purchasedNumber.capabilities,
        savedToAccount: updateSuccess,
        userId: userId, // Include the user ID in the response for debugging
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("[API:purchase-number] Error purchasing number:", error);

    // Generic error response
    return NextResponse.json(
      {
        error: "Failed to purchase number",
        details: error.message,
        code: error.code,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
