import { supabase, supabaseAdmin } from "./supabase";
import { COST_PER_MINUTE } from "./stripe";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

// Utility functions that were previously in rateUtils.ts
// Calculate how many minutes a user can call with given credits
function calculatePotentialDuration(
  rate: number,
  availableCredits: number
): number {
  if (rate <= 0) return 0;
  return Math.floor(availableCredits / rate);
}

// Format a rate for display
function formatRateDisplay(rate: number): string {
  return `$${rate.toFixed(2)}/min`;
}

// Add credits to a user's account
export async function addCreditsToUser(
  userId: string,
  creditsToAdd: number,
  paymentIntentId: string,
  amount: number
) {
  console.log(
    `Starting addCreditsToUser for user ${userId}, adding ${creditsToAdd} credits`
  );

  // Use the admin client if available, otherwise fall back to regular client
  const db: SupabaseClient<Database> = supabaseAdmin || supabase;
  console.log(
    `Using ${supabaseAdmin === db ? "admin" : "regular"} Supabase client`
  );

  try {
    // Fetch the user's current credit balance
    console.log(`Fetching credit balance for user ${userId}`);
    const { data: users, error: userError } = await db
      .from("users")
      .select("credit_balance")
      .eq("id", userId);

    if (userError) {
      console.error(
        `Error fetching user: ${userError.code} - ${userError.message}`
      );
      throw new Error(`Error fetching user: ${userError.message}`);
    }

    let currentBalance = 0;
    let userUpdated = false;

    // Check if user exists
    if (!users || users.length === 0) {
      console.log(`User not found with ID: ${userId}, will create new user`);

      // Create new user with the initial credits
      const { error: insertError } = await db.from("users").insert([
        {
          id: userId,
          credit_balance: creditsToAdd,
        },
      ]);

      if (insertError) {
        console.error(`Error creating user: ${insertError.message}`);

        // If we're using the regular client, this might be due to RLS
        if (db === supabase) {
          console.warn(
            "Using regular client with RLS restrictions - this may cause permission issues"
          );
        }

        console.log("Recording transaction without creating user");
        userUpdated = false;
      } else {
        console.log(`User created with initial balance of ${creditsToAdd}`);
        userUpdated = true;
      }
    } else {
      // User exists, update their balance
      currentBalance = users[0]?.credit_balance || 0;
      const newBalance = currentBalance + creditsToAdd;
      console.log(
        `Updating credit balance from ${currentBalance} to ${newBalance}`
      );

      // Update user's credit balance
      const { error: updateError } = await db
        .from("users")
        .update({
          credit_balance: newBalance,
        })
        .eq("id", userId);

      if (updateError) {
        console.error(
          `Error updating user credits: ${updateError.code} - ${updateError.message}`
        );

        // If we're using the regular client, this might be due to RLS
        if (db === supabase) {
          console.warn(
            "Using regular client with RLS restrictions - this may cause permission issues"
          );

          // If we can't update due to RLS, still record the transaction
          if (updateError.code === "42501") {
            console.log(
              "Permission denied for update, recording transaction only"
            );
            userUpdated = false;
          } else {
            throw new Error(
              `Error updating user credits: ${updateError.message}`
            );
          }
        } else {
          throw new Error(
            `Error updating user credits: ${updateError.message}`
          );
        }
      } else {
        console.log(`Successfully updated balance to ${newBalance}`);
        userUpdated = true;
      }
    }

    console.log(`Recording transaction`);

    // Record the transaction
    const { error: transactionError } = await db.from("transactions").insert({
      user_id: userId,
      amount,
      credits_added: creditsToAdd,
      payment_intent_id: paymentIntentId,
      status: userUpdated ? "completed" : "pending_credit_update",
      notes: userUpdated
        ? null
        : "Transaction recorded but credits not added due to permission issues",
    });

    if (transactionError) {
      console.error(
        `Error recording transaction: ${transactionError.code} - ${transactionError.message}`
      );
      // If we can't record the transaction but already updated the balance,
      // we should log this but not throw an error to avoid breaking the user experience
      console.warn("Warning: Credits were added but transaction record failed");
      // In a production system, you might want to add this to a queue for retry
    } else {
      console.log(`Transaction recorded successfully`);
    }

    return userUpdated;
  } catch (error) {
    console.error("Unexpected error in addCreditsToUser:", error);
    throw error; // Rethrow to be handled by the caller
  }
}

// Updated to use the RateService for more accurate rates
export async function hasEnoughCredits(
  userId: string,
  durationMinutes: number,
  phoneNumber?: string
) {
  console.log(
    `[hasEnoughCredits] Checking if user ${userId} has enough credits for ${durationMinutes} minutes with phone ${
      phoneNumber || "default"
    }`
  );

  try {
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("credit_balance")
      .eq("id", userId);

    if (userError) {
      console.error(
        `[hasEnoughCredits] Error fetching user: ${userError.code} - ${userError.message}`
      );
      throw new Error(`Error fetching user: ${userError.message}`);
    }

    if (!users || users.length === 0) {
      console.log(`[hasEnoughCredits] User not found with ID: ${userId}`);
      return false;
    }

    const creditBalance = parseFloat(users[0].credit_balance);
    console.log(`[hasEnoughCredits] User credit balance: ${creditBalance}`);

    // If a phone number is provided, use the RateService to get the specific rate
    let rate = COST_PER_MINUTE; // Default fallback rate

    if (phoneNumber) {
      try {
        const rateInfo = await fetchRateForNumber(phoneNumber);
        rate = rateInfo.rate;
        console.log(
          `[hasEnoughCredits] Found rate for ${phoneNumber}: ${rate}/min (${rateInfo.country})`
        );
      } catch (error) {
        console.error(
          "[hasEnoughCredits] Error fetching rate information:",
          error
        );
        // Fall back to default rate if there's an error
      }
    }

    // Calculate required credits
    const requiredCredits = rate * durationMinutes;

    console.log(
      `[hasEnoughCredits] User ${userId} has ${creditBalance} credits, needs ${requiredCredits} for ${durationMinutes} minutes at rate ${rate}/min, result: ${
        creditBalance >= requiredCredits
      }`
    );

    return creditBalance >= requiredCredits;
  } catch (error) {
    console.error("[hasEnoughCredits] Error checking credits:", error);
    throw error;
  }
}

/**
 * Check credit balance and calculate estimated talk time
 * Returns detailed information about available credits and call duration
 */
export async function getCreditCallInfo(
  userId: string,
  phoneNumber: string
): Promise<{
  hasEnoughCredits: boolean;
  creditBalance: number;
  estimatedMinutes: number;
  rate: number;
  requiredCredits: number;
  isLowBalance: boolean;
  country?: string;
  countryCode?: string;
  formattedRate?: string;
}> {
  console.log(
    `[getCreditCallInfo] Starting for userId=${userId}, phoneNumber=${phoneNumber}`
  );
  try {
    // Get user's credit balance
    console.log(`[getCreditCallInfo] Fetching user credit balance`);
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("credit_balance")
      .eq("id", userId);

    if (userError) {
      console.error(
        `[getCreditCallInfo] Error fetching user: ${userError.message}`,
        userError
      );
      throw new Error(`Error fetching user: ${userError.message}`);
    }

    if (!users || users.length === 0) {
      console.error(`[getCreditCallInfo] User not found with ID: ${userId}`);
      throw new Error(`User not found with ID: ${userId}`);
    }

    const creditBalance = parseFloat(users[0].credit_balance);
    console.log(`[getCreditCallInfo] User credit balance: ${creditBalance}`);

    // Get rate information for the destination
    console.log(
      `[getCreditCallInfo] Initializing rate service for phoneNumber: ${phoneNumber}`
    );
    try {
      const rateInfo = await fetchRateForNumber(phoneNumber);
      const rate = rateInfo.rate;
      console.log(`[getCreditCallInfo] Using rate of ${rate} per minute`);

      // Calculate estimated talk time based on available credits
      const estimatedMinutes = calculatePotentialDuration(rate, creditBalance);

      // Check if user has enough credits for at least 1 minute
      const hasEnoughForOneMinute = creditBalance >= rate;

      // Calculate required credits for 1 minute
      const requiredCredits = rate;

      // Check if balance is running low (less than 10 minutes of talk time)
      const isLowBalance = estimatedMinutes < 10;

      return {
        hasEnoughCredits: hasEnoughForOneMinute,
        creditBalance,
        estimatedMinutes,
        rate,
        requiredCredits,
        isLowBalance,
        country: rateInfo.country,
        countryCode: rateInfo.countryCode,
        formattedRate: formatRateDisplay(rate),
      };
    } catch (rateError: any) {
      console.error(`[getCreditCallInfo] Error in rate service:`, rateError);
      throw new Error(`Error getting rate information: ${rateError.message}`);
    }
  } catch (error: any) {
    console.error(`[getCreditCallInfo] Unexpected error:`, error);
    throw error;
  }
}

// Add a function to fetch rate from our API
async function fetchRateForNumber(phoneNumber: string): Promise<{
  rate: number;
  country: string;
  countryCode?: string;
}> {
  try {
    const response = await fetch(
      `/api/rates/get-rate?phoneNumber=${encodeURIComponent(phoneNumber)}`
    );

    if (!response.ok) {
      return { rate: COST_PER_MINUTE, country: "Unknown" };
    }

    const data = await response.json();
    if (data.success && data.rate) {
      return {
        rate: data.rate,
        country: data.country || "Unknown",
        countryCode: data.countryCode,
      };
    }

    return { rate: COST_PER_MINUTE, country: "Unknown" };
  } catch (error) {
    console.error("Error fetching rate information:", error);
    return { rate: COST_PER_MINUTE, country: "Unknown" };
  }
}

// Updated to use the RateService for more accurate rates
export async function deductCreditsForCall(
  userId: string,
  durationMinutes: number,
  callSid: string,
  phoneNumber?: string
) {
  console.log(
    `[deductCreditsForCall] Starting credit deduction for user ${userId}:`,
    {
      durationMinutes,
      callSid,
      phoneNumber,
    }
  );

  try {
    // Input validation
    if (durationMinutes <= 0) {
      console.log(
        `[deductCreditsForCall] Invalid duration: ${durationMinutes}`
      );
      return;
    }

    // Get the user's current credit balance
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("credit_balance")
      .eq("id", userId);

    if (userError) {
      console.error(
        `[deductCreditsForCall] Error fetching user: ${userError.code} - ${userError.message}`
      );
      throw new Error(`Error fetching user: ${userError.message}`);
    }

    if (!users || users.length === 0) {
      console.log(`[deductCreditsForCall] User not found with ID: ${userId}`);
      throw new Error(`User not found with ID: ${userId}`);
    }

    // Determine the appropriate rate to charge
    let rate = COST_PER_MINUTE; // Default fallback rate

    if (phoneNumber) {
      try {
        // Use our new API endpoint instead of RateService
        const rateInfo = await fetchRateForNumber(phoneNumber);
        rate = rateInfo.rate;
        console.log(`[deductCreditsForCall] Using rate of ${rate}/min`);
      } catch (error) {
        console.error(
          "[deductCreditsForCall] Error fetching rate information:",
          error
        );
        // Fall back to default rate if there's an error
      }
    }

    // Calculate credits to deduct (rounded to 2 decimal places for billing accuracy)
    const creditsToDeduct = parseFloat((rate * durationMinutes).toFixed(2));
    const currentBalance = parseFloat(users[0].credit_balance);
    const newBalance = Math.max(
      0,
      parseFloat((currentBalance - creditsToDeduct).toFixed(2))
    );

    console.log(`[deductCreditsForCall] Credit calculation:`, {
      currentBalance,
      creditsToDeduct,
      newBalance,
      rate,
    });

    // Update user's credit balance - this is the most important part
    const { error: updateError } = await supabase
      .from("users")
      .update({ credit_balance: newBalance })
      .eq("id", userId);

    if (updateError) {
      console.error(
        `[deductCreditsForCall] Error updating user: ${updateError.code} - ${updateError.message}`
      );
      throw new Error(`Error updating user: ${updateError.message}`);
    }

    // Only try to update essential fields in the call log
    try {
      const { error: logError } = await supabase
        .from("call_logs")
        .update({
          duration_minutes: durationMinutes,
          credits_used: creditsToDeduct,
          status: "completed",
        })
        .eq("call_sid", callSid)
        .eq("user_id", userId);

      if (logError) {
        console.error(
          `[deductCreditsForCall] Error updating call log: ${logError.code} - ${logError.message}`
        );
        // Don't throw here, we've already updated the credits
        console.log(
          "[deductCreditsForCall] Failed to update call log but credits were deducted"
        );
      }
    } catch (logError) {
      console.error(
        "[deductCreditsForCall] Error updating call log:",
        logError
      );
      console.log(
        "[deductCreditsForCall] Failed to update call log but credits were deducted"
      );
    }

    console.log(
      `[deductCreditsForCall] Successfully completed credit deduction:`,
      {
        userId,
        creditsDeducted: creditsToDeduct,
        newBalance,
      }
    );

    return {
      success: true,
      creditsDeducted: creditsToDeduct,
      newBalance,
    };
  } catch (error) {
    console.error("[deductCreditsForCall] Error:", error);
    throw error;
  }
}

// Get user's credit balance
export async function getUserCreditBalance(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<number> {
  try {
    console.log("Fetching credit balance for user:", userId);

    // First check if the user exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id, credit_balance, email")
      .eq("id", userId);

    if (checkError) {
      console.error("Error checking if user exists:", checkError);
      throw new Error(
        `Error fetching user credit balance: ${checkError.message}`
      );
    }

    // If user doesn't exist, create the user with 0 credits
    if (!existingUser || existingUser.length === 0) {
      console.log(
        "User not found in public.users table, creating user with 0 credits"
      );

      // Get user's email from auth
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) {
        console.error("Error getting user data:", userError);
        return 0; // Return 0 credits if we can't get email
      }

      const email = userData.user?.email || "unknown@example.com";

      // Create the user with 0 credits
      const { error: insertError } = await supabase.from("users").insert([
        {
          id: userId,
          email: email,
          credit_balance: 0,
        },
      ]);

      if (insertError) {
        console.error("Error creating user:", insertError);
        // If we can't create the user, still return 0 credits
        return 0;
      }

      console.log("User created successfully with 0 credits");
      return 0;
    }

    // If multiple user records are found (shouldn't happen but let's handle it)
    if (existingUser.length > 1) {
      console.warn(
        `Found ${existingUser.length} records for user ${userId}, using the first one.`
      );

      // Use the first record's credit balance
      console.log(
        "Credit balance from first record:",
        existingUser[0].credit_balance
      );
      return existingUser[0].credit_balance || 0;
    }

    // User exists (single record), directly return their credit balance
    console.log(
      "Credit balance fetched successfully:",
      existingUser[0].credit_balance
    );
    return existingUser[0].credit_balance || 0;
  } catch (error) {
    console.error("Error in getUserCreditBalance:", error);
    // Return 0 credits in case of any error
    return 0;
  }
}

/**
 * Get a user's call history with detailed information
 */
export async function getUserCallHistory(
  userId: string,
  limit: number = 10,
  offset: number = 0
): Promise<{
  calls: any[];
  total: number;
  hasMore: boolean;
}> {
  try {
    // Get count of all calls for this user
    const { count, error: countError } = await supabase
      .from("call_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) {
      throw new Error(`Error counting calls: ${countError.message}`);
    }

    // Get the requested page of call logs with most recent first
    const { data: calls, error: callsError } = await supabase
      .from("call_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (callsError) {
      throw new Error(`Error fetching call logs: ${callsError.message}`);
    }

    const total = count || 0;
    const hasMore = total > offset + limit;

    return {
      calls: calls || [],
      total,
      hasMore,
    };
  } catch (error) {
    console.error("Error fetching call history:", error);
    throw error;
  }
}
