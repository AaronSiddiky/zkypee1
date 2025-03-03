import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the origin from the request
  const origin = request.headers.get("origin") || "";

  // Create a response object from the request
  const response = NextResponse.next();

  // Add CORS headers to the response
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");

  // Return the response with CORS headers
  return response;
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: "/api/:path*",
};
