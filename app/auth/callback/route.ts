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
  console.log("URL hash:", requestUrl.hash);
  console.log("Full URL:", requestUrl.toString());

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

  // Check if URL contains a fragment which is #access_token=... for password reset links
  const fullUrl = request.url;
  const hasResetToken =
    fullUrl.includes("#access_token=") || type === "recovery";

  if (hasResetToken) {
    console.log(
      "Password reset detected, redirecting to reset confirmation page"
    );
    // Extract the hash from the full URL
    const hashPart = fullUrl.split("#")[1];
    const redirectHash = hashPart ? `#${hashPart}` : "";

    // For password reset operations, redirect to the reset password confirmation page with hash
    return NextResponse.redirect(
      `${baseUrl}/auth/reset-password/confirm${redirectHash}`
    );
  } else {
    console.log("Standard auth flow, redirecting to home page");
    // For other auth operations (sign-in, sign-up), redirect to home
    return NextResponse.redirect(baseUrl);
  }
}
