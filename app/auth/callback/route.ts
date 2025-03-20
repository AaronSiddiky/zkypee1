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

  // Check if this is a password recovery flow
  if (type === "recovery") {
    console.log("Password recovery flow detected");

    // For password reset, we use a special HTML response that handles the redirect
    // with JavaScript to preserve the hash
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redirecting...</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            text-align: center;
            background: #f7f7f7;
          }
          .loader {
            border: 5px solid #f3f3f3;
            border-top: 5px solid #3498db;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <h2>Redirecting to password reset page...</h2>
        <div class="loader"></div>
        <p>If you are not redirected automatically, <a href="${baseUrl}/auth/reset-password/confirm" id="fallback-link">click here</a>.</p>
        
        <script>
          // This script preserves the URL hash across redirects
          window.onload = function() {
            const hash = window.location.hash;
            console.log("Hash to preserve:", hash);
            
            // Add type=recovery to the URL to help identify this is a recovery flow
            const redirectUrl = "${baseUrl}/auth/reset-password/confirm?type=recovery" + hash;
            console.log("Redirecting to:", redirectUrl);
            
            // Update the fallback link
            document.getElementById('fallback-link').href = redirectUrl;
            
            // Redirect preserving the hash
            window.location.href = redirectUrl;
          };
        </script>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } else {
    // For other auth operations, do a normal redirect to the base URL
    console.log("Standard auth flow, redirecting to home page");
    return NextResponse.redirect(baseUrl);
  }
}
