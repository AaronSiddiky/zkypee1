import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// List of allowed origins for CORS
const allowedOrigins = [
  process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com", // Main app domain
  "http://localhost:3000", // Local development
];

export function middleware(request: NextRequest) {
  // Get the origin from the request
  const origin = request.headers.get("origin") || "";

  // Check if the origin is in our allowed list
  const isAllowedOrigin = allowedOrigins.includes(origin);

  // Only set specific CORS headers if the origin is allowed
  const corsHeaders = {
    "Access-Control-Allow-Origin": isAllowedOrigin ? origin : "",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };

  // For preflight requests, return an empty response with headers
  if (request.method === "OPTIONS") {
    return NextResponse.json({}, { headers: corsHeaders });
  }

  // For non-whitelisted origins, we still process the request
  // but don't add CORS headers to prevent cross-origin access
  const response = NextResponse.next();

  // Add CORS headers only if origin is allowed
  if (isAllowedOrigin) {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: "/api/:path*",
};
