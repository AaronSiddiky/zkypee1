import { supabase, supabaseAdmin, requireAdmin } from "./supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

/**
 * Add a purchased phone number to a user's account
 * @param userId - The ID of the user
 * @param phoneNumber - The phone number that was purchased
 * @param phoneNumberDetails - Optional additional details about the phone number (SID, etc.)
 * @param serverClient - Optional server component client (passed from API route)
 * @returns boolean indicating success
 */
export async function addPhoneNumberToUser(
  userId: string,
  phoneNumber: string,
  phoneNumberDetails?: {
    sid: string;
    friendlyName?: string;
    dateCreated?: string;
    capabilities?: {
      voice?: boolean;
      sms?: boolean;
      mms?: boolean;
    };
  },
  serverClient?: SupabaseClient<Database>
): Promise<boolean> {
  console.log(
    `[addPhoneNumberToUser] Adding phone number ${phoneNumber} to user ${userId}`
  );

  // Try all client approaches in sequence
  let success = false;

  // Retry function with exponential backoff
  const retry = async (
    fn: () => Promise<boolean>,
    maxAttempts = 3,
    delay = 500
  ) => {
    let attempts = 0;
    let currentDelay = delay;

    while (attempts < maxAttempts) {
      try {
        const result = await fn();
        if (result) return true;
      } catch (error) {
        console.error(`Retry attempt ${attempts + 1} failed:`, error);
      }

      attempts++;
      if (attempts >= maxAttempts) break;

      console.log(
        `Waiting ${currentDelay}ms before retry ${attempts + 1}/${maxAttempts}`
      );
      await new Promise((r) => setTimeout(r, currentDelay));
      currentDelay *= 2; // Exponential backoff
    }

    return false;
  };

  // First check if phone number is already saved to user
  try {
    // Use provided server client or fall back to standard client
    const client = serverClient || supabase;
    const { data: userData, error: fetchError } = await client
      .from("users")
      .select("purchased_phone_numbers")
      .eq("id", userId)
      .single();

    if (
      !fetchError &&
      userData?.purchased_phone_numbers?.includes(phoneNumber)
    ) {
      console.log(
        `[addPhoneNumberToUser] Phone number already exists in user's account`
      );
      return true; // Early return if already saved
    }
  } catch (error) {
    console.error("Error checking existing phone numbers:", error);
    // Continue to attempts - don't return here
  }

  // 1. Try with provided server client
  if (serverClient && !success) {
    success = await retry(async () => {
      console.log(`[addPhoneNumberToUser] Trying with server component client`);

      // Get current phone numbers
      const { data: userData, error: fetchError } = await serverClient
        .from("users")
        .select("purchased_phone_numbers")
        .eq("id", userId)
        .single();

      if (fetchError) {
        console.error(
          `[addPhoneNumberToUser] Error fetching user data with server client:`,
          fetchError
        );
        return false;
      }

      // Get current phone numbers or initialize empty array
      const currentPhoneNumbers = userData?.purchased_phone_numbers || [];

      // Don't add duplicate numbers
      if (!currentPhoneNumbers.includes(phoneNumber)) {
        const updatedPhoneNumbers = [...currentPhoneNumbers, phoneNumber];

        // Update the user record
        const { error: updateError } = await serverClient
          .from("users")
          .update({
            purchased_phone_numbers: updatedPhoneNumbers,
          })
          .eq("id", userId);

        if (updateError) {
          console.error(
            `[addPhoneNumberToUser] Error updating user with server client:`,
            updateError
          );
          return false;
        }

        console.log(`[addPhoneNumberToUser] Server client update successful`);
        return true;
      } else {
        console.log(
          `[addPhoneNumberToUser] Phone number already exists in user's account`
        );
        return true;
      }
    });
  }

  // 2. If server client failed, try with admin client (safely)
  if (!success) {
    success = await retry(async () => {
      console.log(`[addPhoneNumberToUser] Trying with admin client`);

      try {
        // Safely get admin client - this will throw if not available
        const admin = requireAdmin();

        // Get current phone numbers
        const { data: userData, error: fetchError } = await admin
          .from("users")
          .select("purchased_phone_numbers")
          .eq("id", userId)
          .single();

        if (fetchError) {
          console.error(
            `[addPhoneNumberToUser] Error fetching user data with admin client:`,
            fetchError
          );
          return false;
        }

        // Get current phone numbers or initialize empty array
        const currentPhoneNumbers = userData?.purchased_phone_numbers || [];

        // Don't add duplicate numbers
        if (!currentPhoneNumbers.includes(phoneNumber)) {
          const updatedPhoneNumbers = [...currentPhoneNumbers, phoneNumber];

          // Update the user record
          const { error: updateError } = await admin
            .from("users")
            .update({
              purchased_phone_numbers: updatedPhoneNumbers,
            })
            .eq("id", userId);

          if (updateError) {
            console.error(
              `[addPhoneNumberToUser] Error updating user with admin client:`,
              updateError
            );
            return false;
          }

          console.log(`[addPhoneNumberToUser] Admin client update successful`);
          return true;
        } else {
          console.log(
            `[addPhoneNumberToUser] Phone number already exists in user's account (admin)`
          );
          return true;
        }
      } catch (error) {
        console.error(
          `[addPhoneNumberToUser] Admin client not available:`,
          error
        );
        return false;
      }
    });
  }

  // 3. If admin client failed, try with regular client
  if (!success) {
    success = await retry(async () => {
      console.log(`[addPhoneNumberToUser] Trying with regular client`);

      // Get current phone numbers
      const { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("purchased_phone_numbers")
        .eq("id", userId)
        .single();

      if (fetchError) {
        console.error(
          `[addPhoneNumberToUser] Error fetching user data with regular client:`,
          fetchError
        );
        return false;
      }

      // Get current phone numbers or initialize empty array
      const currentPhoneNumbers = userData?.purchased_phone_numbers || [];

      // Don't add duplicate numbers
      if (!currentPhoneNumbers.includes(phoneNumber)) {
        const updatedPhoneNumbers = [...currentPhoneNumbers, phoneNumber];

        // Update the user record
        const { error: updateError } = await supabase
          .from("users")
          .update({
            purchased_phone_numbers: updatedPhoneNumbers,
          })
          .eq("id", userId);

        if (updateError) {
          console.error(
            `[addPhoneNumberToUser] Error updating user with regular client:`,
            updateError
          );
          return false;
        }

        console.log(`[addPhoneNumberToUser] Regular client update successful`);
        return true;
      } else {
        console.log(
          `[addPhoneNumberToUser] Phone number already exists in user's account (regular)`
        );
        return true;
      }
    });
  }

  // 4. Try with RPC call as a last resort if all previous methods failed
  if (!success) {
    success = await retry(async () => {
      console.log(`[addPhoneNumberToUser] Trying with RPC call`);

      try {
        // Try admin first, fall back to regular client
        let client = supabase;
        try {
          client = requireAdmin();
        } catch (e) {
          console.log(
            "Admin client not available for RPC, using regular client"
          );
        }

        const { data, error } = await client.rpc("add_phone_number_to_user", {
          p_user_id: userId,
          p_phone_number: phoneNumber,
        });

        if (error) {
          console.error(`[addPhoneNumberToUser] RPC call failed:`, error);
          return false;
        }

        console.log(`[addPhoneNumberToUser] RPC call successful:`, data);
        return !!data;
      } catch (error) {
        console.error(`[addPhoneNumberToUser] RPC error:`, error);
        return false;
      }
    });
  }

  // 5. Record in purchased_numbers table as backup (always do this regardless of success)
  try {
    console.log(`[addPhoneNumberToUser] Recording in purchased_numbers table`);
    // Use the server client if available, otherwise fall back to regular client
    const client = serverClient || supabase;
    const { error: purchaseError } = await client
      .from("purchased_numbers")
      .insert({
        user_id: userId,
        phone_number: phoneNumber,
        sid: phoneNumberDetails?.sid,
        friendly_name: phoneNumberDetails?.friendlyName,
        date_created: phoneNumberDetails?.dateCreated,
        capabilities: phoneNumberDetails?.capabilities,
        status: "active",
      });

    if (purchaseError) {
      console.warn(
        `[addPhoneNumberToUser] Error recording in purchased_numbers table:`,
        purchaseError
      );
    } else {
      console.log(
        `[addPhoneNumberToUser] Successfully recorded in purchased_numbers table`
      );
    }
  } catch (error) {
    console.warn(
      `[addPhoneNumberToUser] Exception recording in purchased_numbers:`,
      error
    );
  }

  console.log(
    `[addPhoneNumberToUser] Final result: ${success ? "Success" : "Failure"}`
  );
  return success;
}

/**
 * Get all phone numbers for a user
 * @param userId - The ID of the user
 * @returns Array of phone numbers
 */
export async function getUserPhoneNumbers(userId: string): Promise<string[]> {
  console.log(
    `[getUserPhoneNumbers] Fetching phone numbers for user ${userId}`
  );

  try {
    // First try to get from users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("purchased_phone_numbers")
      .eq("id", userId)
      .single();

    if (!userError && userData?.purchased_phone_numbers) {
      const phoneNumbers = userData.purchased_phone_numbers || [];
      console.log(
        `[getUserPhoneNumbers] Found ${phoneNumbers.length} phone numbers in users table for user ${userId}`
      );
      return phoneNumbers;
    }

    // If that fails or returns empty, try the purchased_numbers table
    if (userError || !userData?.purchased_phone_numbers) {
      console.log(`[getUserPhoneNumbers] Checking purchased_numbers table`);

      const { data: purchasedData, error: purchasedError } = await supabase
        .from("purchased_numbers")
        .select("phone_number")
        .eq("user_id", userId)
        .eq("status", "active");

      if (!purchasedError && purchasedData && purchasedData.length > 0) {
        const phoneNumbers = purchasedData.map((item) => item.phone_number);
        console.log(
          `[getUserPhoneNumbers] Found ${phoneNumbers.length} phone numbers in purchased_numbers table for user ${userId}`
        );
        return phoneNumbers;
      }
    }

    // If we got here and had an error with the users table, log it
    if (userError) {
      console.error(
        `[getUserPhoneNumbers] Error fetching from users table: ${userError.code} - ${userError.message}`
      );
    }

    // Return empty array if nothing found
    return [];
  } catch (error) {
    console.error(`[getUserPhoneNumbers] Unexpected error:`, error);
    return [];
  }
}

/**
 * Remove a phone number from a user's account
 * @param userId - The ID of the user
 * @param phoneNumber - The phone number to remove
 * @returns boolean indicating success
 */
export async function removePhoneNumberFromUser(
  userId: string,
  phoneNumber: string
): Promise<boolean> {
  console.log(
    `[removePhoneNumberFromUser] Removing phone number ${phoneNumber} from user ${userId}`
  );

  let success = false;

  // 1. Update the users table
  try {
    // Get current phone numbers
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("purchased_phone_numbers")
      .eq("id", userId)
      .single();

    if (!fetchError && userData) {
      // Filter out the phone number to remove
      const currentPhoneNumbers: string[] =
        userData.purchased_phone_numbers || [];
      const updatedPhoneNumbers = currentPhoneNumbers.filter(
        (num) => num !== phoneNumber
      );

      // Only update if the array has changed
      if (currentPhoneNumbers.length !== updatedPhoneNumbers.length) {
        const { error: updateError } = await supabase
          .from("users")
          .update({
            purchased_phone_numbers: updatedPhoneNumbers,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (!updateError) {
          console.log(
            `[removePhoneNumberFromUser] Successfully updated users table`
          );
          success = true;
        } else {
          console.error(
            `[removePhoneNumberFromUser] Error updating users table: ${updateError.message}`
          );
        }
      } else {
        console.log(
          `[removePhoneNumberFromUser] Phone number not found in users table`
        );
      }
    } else if (fetchError) {
      console.error(
        `[removePhoneNumberFromUser] Error fetching from users table: ${fetchError.message}`
      );
    }
  } catch (error) {
    console.error(`[removePhoneNumberFromUser] Error with users table:`, error);
  }

  // 2. Update the purchased_numbers table
  try {
    const { error: purchasedError } = await supabase
      .from("purchased_numbers")
      .update({ status: "inactive" })
      .eq("user_id", userId)
      .eq("phone_number", phoneNumber);

    if (!purchasedError) {
      console.log(
        `[removePhoneNumberFromUser] Successfully updated purchased_numbers table`
      );
      success = true;
    } else {
      console.error(
        `[removePhoneNumberFromUser] Error updating purchased_numbers table: ${purchasedError.message}`
      );
    }
  } catch (error) {
    console.error(
      `[removePhoneNumberFromUser] Error with purchased_numbers table:`,
      error
    );
  }

  return success;
}

/**
 * Get user's phone numbers with their associated subscription IDs
 * @param userId - The ID of the user
 * @returns Map of phone numbers to subscription IDs
 */
export async function getUserPhoneNumbersWithSubscriptions(
  userId: string
): Promise<Map<string, string>> {
  console.log(
    `[getUserPhoneNumbersWithSubscriptions] Fetching data for user ${userId}`
  );

  try {
    const { data: userData, error } = await supabase
      .from("users")
      .select("purchased_phone_numbers, stripe_subscription_ids")
      .eq("id", userId)
      .single();

    if (error) {
      console.error(`Error fetching user subscription data: ${error.message}`);
      return new Map();
    }

    console.log(`User data:`, JSON.stringify(userData, null, 2));

    if (!userData) {
      console.log(`No user data found for user ${userId}`);
      return new Map();
    }

    const phoneNumbers = userData.purchased_phone_numbers || [];
    const subscriptionIds = userData.stripe_subscription_ids || [];

    console.log(`Phone numbers from DB:`, phoneNumbers);
    console.log(`Subscription IDs from DB:`, subscriptionIds);

    if (phoneNumbers.length === 0) {
      console.log(`No phone numbers found for user ${userId}`);
      return new Map();
    }

    if (!subscriptionIds || subscriptionIds.length === 0) {
      console.log(`No subscription IDs found for user ${userId}`);
      // If we have phone numbers but no subscriptions, create a map with empty subscription IDs
      const numbersMap = new Map<string, string>();
      phoneNumbers.forEach((number: string) => {
        numbersMap.set(number, "");
      });
      return numbersMap;
    }

    // Create a map of phone numbers to subscription IDs
    const numbersToSubscriptions = new Map<string, string>();

    // Both arrays should have the same length, with items at the same index being related
    // But we'll be cautious in case they don't match exactly
    for (let i = 0; i < phoneNumbers.length; i++) {
      // If we have a subscription ID for this phone number, add it to the map
      if (i < subscriptionIds.length) {
        numbersToSubscriptions.set(phoneNumbers[i], subscriptionIds[i]);
        console.log(
          `Mapped ${phoneNumbers[i]} to subscription ${subscriptionIds[i]}`
        );
      } else {
        // If no matching subscription ID, use an empty string
        numbersToSubscriptions.set(phoneNumbers[i], "");
        console.log(`Mapped ${phoneNumbers[i]} to empty subscription ID`);
      }
    }

    console.log(
      `[getUserPhoneNumbersWithSubscriptions] Found ${numbersToSubscriptions.size} phone numbers with subscriptions`
    );

    // Debug: print the final map
    console.log("Final phone numbers to subscriptions map:");
    numbersToSubscriptions.forEach((subId, phoneNumber) => {
      console.log(`${phoneNumber} => ${subId}`);
    });

    return numbersToSubscriptions;
  } catch (error) {
    console.error(
      `[getUserPhoneNumbersWithSubscriptions] Unexpected error:`,
      error
    );
    return new Map();
  }
}
