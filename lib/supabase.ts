import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined";

// Debug logging for environment variables (only log what's safe in browser)
console.log("[SUPABASE] Environment check:", {
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  hasServiceRoleKey: !isBrowser && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  environment: isBrowser ? "browser" : "server",
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Initialize admin client only on the server side
let supabaseAdmin: typeof supabase | null = null;

// Only initialize the admin client on the server
if (!isBrowser) {
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseServiceRoleKey) {
    console.error(
      "CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not set. Admin operations will fail."
    );
  } else if (!supabaseUrl) {
    console.error("CRITICAL: NEXT_PUBLIC_SUPABASE_URL is not set");
  } else {
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
      console.error(
        "CRITICAL: Failed to initialize Supabase admin client:",
        error
      );
    }
  }
}

// Helper function to ensure admin client is available
export function requireAdmin() {
  // In browser context, throw a more helpful error
  if (isBrowser) {
    throw new Error(
      "Admin operations are not available in the browser. This function must be called from server-side code."
    );
  }

  // On server, check if admin client is available
  if (!supabaseAdmin) {
    throw new Error(
      "Admin client not available. Check SUPABASE_SERVICE_ROLE_KEY configuration."
    );
  }

  return supabaseAdmin;
}

export { supabaseAdmin };
