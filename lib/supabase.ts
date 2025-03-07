import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Create a service role client for admin operations that bypass RLS
// This should ONLY be used on the server side
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Check if we have a valid service role key before creating the admin client
let supabaseAdmin = supabase; // Default to regular client

if (supabaseServiceRoleKey && supabaseUrl) {
  try {
    supabaseAdmin = createClient<Database>(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          persistSession: false,
        },
      }
    );
    console.log("Supabase admin client initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Supabase admin client:", error);
    // Fall back to regular client if admin client initialization fails
  }
} else {
  console.warn(
    "Missing SUPABASE_SERVICE_ROLE_KEY, admin operations will be limited"
  );
  // Fall back to regular client if service role key is missing
}

export { supabaseAdmin };
