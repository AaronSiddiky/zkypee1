import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type"); // Get the type parameter

  console.log("Auth callback called with URL:", request.url);
  console.log("Origin detected as:", requestUrl.origin);
  console.log("Auth operation type:", type);

  // Determine the correct redirect URL
  // If NEXT_PUBLIC_BASE_URL is set, use that instead of the request origin
  // This helps with Google OAuth redirects
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || requestUrl.origin;
  console.log("Using base URL for redirect:", baseUrl);

  if (code) {
    console.log("Code parameter found, exchanging for session");
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
  } else {
    console.log("No code parameter found in callback URL");
  }

  // Determine the appropriate redirect based on the operation type
  if (type === "recovery") {
    // If this is a password recovery operation, redirect to the reset password confirmation page
    return NextResponse.redirect(
      `${baseUrl}/auth/reset-password/confirm${requestUrl.hash}`
    );
  } else {
    // For other auth operations (sign-in, sign-up), redirect to home
    return NextResponse.redirect(baseUrl);
  }
}
