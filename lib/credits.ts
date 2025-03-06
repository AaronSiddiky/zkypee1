import { supabase } from "./supabase";
import { COST_PER_MINUTE } from "./stripe";
import { SupabaseClient } from "@supabase/supabase-js";

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

  try {
    // Fetch the user's current credit balance
    console.log(`Fetching credit balance for user ${userId}`);
    const { data: users, error: userError } = await supabase
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

    // Check if user exists
    if (!users || users.length === 0) {
      console.log(`User not found with ID: ${userId}, will create new user`);

      // Create new user with the initial credits
      const { error: insertError } = await supabase.from("users").insert([
        {
          id: userId,
          credit_balance: creditsToAdd,
        },
      ]);

      if (insertError) {
        // If we can't create the user due to RLS, we'll use the service function approach
        console.error(`Error creating user: ${insertError.message}`);
        console.log("Recording transaction without creating user");

        // Just record the transaction
        const { error: transactionError } = await supabase
          .from("transactions")
          .insert({
            user_id: userId,
            amount,
            credits_added: creditsToAdd,
            payment_intent_id: paymentIntentId,
            status: "completed",
          });

        if (transactionError) {
          console.error(
            `Error recording transaction: ${transactionError.message}`
          );
        } else {
          console.log(`Transaction recorded successfully`);
        }

        return true; // Return success even though we couldn't create the user
      }

      console.log(`User created with initial balance of ${creditsToAdd}`);
    } else {
      // User exists, update their balance
      currentBalance = users[0]?.credit_balance || 0;
      const newBalance = currentBalance + creditsToAdd;
      console.log(
        `Updating credit balance from ${currentBalance} to ${newBalance}`
      );

      // Update user's credit balance
      const { error: updateError } = await supabase
        .from("users")
        .update({
          credit_balance: newBalance,
        })
        .eq("id", userId);

      if (updateError) {
        console.error(
          `Error updating user credits: ${updateError.code} - ${updateError.message}`
        );

        // If we can't update due to RLS, still record the transaction
        if (updateError.code === "42501") {
          // PostgreSQL permission denied code
          console.log(
            "Permission denied for update, recording transaction only"
          );
        } else {
          throw new Error(
            `Error updating user credits: ${updateError.message}`
          );
        }
      } else {
        console.log(`Successfully updated balance to ${newBalance}`);
      }
    }

    console.log(`Recording transaction`);

    // Record the transaction
    const { error: transactionError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        amount,
        credits_added: creditsToAdd,
        payment_intent_id: paymentIntentId,
        status: "completed",
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

    return true;
  } catch (error) {
    console.error("Unexpected error in addCreditsToUser:", error);
    throw error; // Rethrow to be handled by the caller
  }
}

// Check if a user has enough credits for a call
export async function hasEnoughCredits(
  userId: string,
  durationMinutes: number
) {
  console.log(`Checking if user ${userId} has enough credits for ${durationMinutes} minutes`);
  const requiredCredits = durationMinutes * COST_PER_MINUTE;
  console.log(`Required credits: ${requiredCredits} (${durationMinutes} minutes at ${COST_PER_MINUTE}/min)`);

  // Try to get the user's credit balance
  const { data: user, error } = await supabase
    .from("users")
    .select("credit_balance")
    .eq("id", userId)
    .maybeSingle(); // Use maybeSingle instead of single

  // If user doesn't exist, create them with default credits
  if (error || !user) {
    console.log("User not found in database, creating user record");
    
    // Default credits for new users
    const defaultCredits = 5.00;
    
    // Create the user with default credits
    const { error: insertError } = await supabase
      .from("users")
      .insert([{ id: userId, credit_balance: defaultCredits }]);
    
    if (insertError) {
      console.error("Error creating user record:", insertError);
      // Continue with default credits even if insert fails
    } else {
      console.log(`User created with default balance of ${defaultCredits}`);
    }
    
    // Check if default credits are enough
    console.log(`User credit balance (default): ${defaultCredits}`);
    console.log(`Has enough credits: ${defaultCredits >= requiredCredits}`);
    
    return defaultCredits >= requiredCredits;
  }

  const creditBalance = user?.credit_balance || 0;
  console.log(`User credit balance: ${creditBalance}`);
  console.log(`Has enough credits: ${creditBalance >= requiredCredits}`);
  
  return creditBalance >= requiredCredits;
}

// Deduct credits after a call
export async function deductCreditsForCall(
  userId: string,
  durationMinutes: number,
  callSid: string
) {
  const creditsToDeduct = durationMinutes * COST_PER_MINUTE;

  // Start a transaction
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("credit_balance")
    .eq("id", userId)
    .single();

  if (userError) {
    throw new Error(`Error fetching user: ${userError.message}`);
  }

  if ((user.credit_balance || 0) < creditsToDeduct) {
    throw new Error("Insufficient credits");
  }

  // Update user's credit balance
  const { error: updateError } = await supabase
    .from("users")
    .update({
      credit_balance: (user.credit_balance || 0) - creditsToDeduct,
    })
    .eq("id", userId);

  if (updateError) {
    throw new Error(`Error updating user credits: ${updateError.message}`);
  }

  // Record the call log
  const { error: callLogError } = await supabase.from("call_logs").insert({
    user_id: userId,
    duration_minutes: durationMinutes,
    credits_used: creditsToDeduct,
    call_sid: callSid,
    status: "completed",
  });

  if (callLogError) {
    throw new Error(`Error recording call log: ${callLogError.message}`);
  }

  return true;
}

// Get user's credit balance
export async function getUserCreditBalance(
  supabase: SupabaseClient,
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
