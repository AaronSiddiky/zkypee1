// Service Worker to filter sensitive token information from network requests
self.addEventListener("install", (event) => {
  console.log("Token filter service worker installed");
  self.skipWaiting(); // Activate worker immediately
});

self.addEventListener("activate", (event) => {
  console.log("Token filter service worker activated");
  event.waitUntil(clients.claim()); // Take control of all clients
});

// Function to check if a request is to Twilio or Supabase
function isSensitiveRequest(url) {
  return (
    url.includes("twilio.com") ||
    url.includes("twiliocdn.com") ||
    url.includes("twilio.io") ||
    url.includes("supabase.co") ||
    url.includes("zkypee.com/api")
  );
}

// Function to check if a request contains a user ID
function containsUserId(url) {
  // Check for UUID pattern in URL
  const uuidPattern =
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  return uuidPattern.test(url);
}

// Function to redact user IDs from URLs
function redactUserIds(url) {
  // Replace UUIDs with [REDACTED-USER-ID]
  return url.replace(
    /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi,
    "[REDACTED-USER-ID]"
  );
}

// Function to check if a response might contain a token
function mightContainToken(body) {
  if (!body) return false;

  // Check for common token patterns
  return body.includes("token") || body.includes("jwt") || body.includes("eyJ"); // JWT tokens start with this
}

// Function to redact tokens from JSON
function redactTokens(jsonString) {
  try {
    // Try to parse as JSON
    const obj = JSON.parse(jsonString);

    // Recursively search and redact tokens
    function redact(obj) {
      if (!obj || typeof obj !== "object") return obj;

      Object.keys(obj).forEach((key) => {
        // Check if this is a token field
        if (
          (key === "token" || key.includes("token") || key === "jwt") &&
          typeof obj[key] === "string"
        ) {
          obj[key] = "[REDACTED]";
        }
        // Check if this is a JWT token (starts with eyJ)
        else if (typeof obj[key] === "string" && obj[key].startsWith("eyJ")) {
          obj[key] = "[REDACTED]";
        }
        // Recursively check nested objects
        else if (typeof obj[key] === "object" && obj[key] !== null) {
          redact(obj[key]);
        }
      });

      return obj;
    }

    return JSON.stringify(redact(obj));
  } catch (e) {
    // If not valid JSON, try to redact using regex
    return jsonString
      .replace(/("token":\s*")([^"]+)(")/g, "$1[REDACTED]$3")
      .replace(/("jwt":\s*")([^"]+)(")/g, "$1[REDACTED]$3")
      .replace(/(token=)([^&]+)(&|$)/g, "$1[REDACTED]$3");
  }
}

// Intercept fetch requests
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only intercept sensitive requests
  if (isSensitiveRequest(request.url)) {
    // Clone the request to avoid consuming it
    const requestClone = request.clone();

    // Handle POST requests that might contain tokens in the body
    if (request.method === "POST" || request.method === "PUT") {
      event.respondWith(
        (async () => {
          try {
            // Get the original response
            const response = await fetch(request);
            const responseClone = response.clone();

            // Check if we need to filter the response
            const contentType = response.headers.get("Content-Type") || "";
            if (
              contentType.includes("application/json") ||
              contentType.includes("text/plain")
            ) {
              const originalBody = await responseClone.text();

              if (mightContainToken(originalBody)) {
                // Redact tokens from the response
                const filteredBody = redactTokens(originalBody);

                // Create a new response with filtered body
                return new Response(filteredBody, {
                  status: response.status,
                  statusText: response.statusText,
                  headers: response.headers,
                });
              }
            }

            return response;
          } catch (error) {
            console.error("Error in service worker:", error);
            // Fall back to original request if something goes wrong
            return fetch(request);
          }
        })()
      );
    }
    // For WebSocket connections, we can't modify them directly
    else if (request.url.includes("wss://") || request.url.includes("ws://")) {
      // We can't intercept WebSocket traffic, but we can log that it's happening
      console.log("WebSocket connection detected:", request.url);
    }
    // For GET requests with sensitive information
    else if (request.url.includes("token=") || containsUserId(request.url)) {
      // Create a modified URL
      let modifiedUrl = request.url;

      // Redact token parameters if present
      if (modifiedUrl.includes("token=")) {
        const url = new URL(modifiedUrl);
        if (url.searchParams.has("token")) {
          url.searchParams.set("token", "[REDACTED]");
        }
        modifiedUrl = url.toString();
      }

      // Redact user IDs if present
      if (containsUserId(modifiedUrl)) {
        modifiedUrl = redactUserIds(modifiedUrl);
      }

      // If URL was modified, create a new request
      if (modifiedUrl !== request.url) {
        // Create a new request with the modified URL
        const filteredRequest = new Request(modifiedUrl, {
          method: request.method,
          headers: request.headers,
          mode: request.mode,
          credentials: request.credentials,
          cache: request.cache,
          redirect: request.redirect,
          referrer: request.referrer,
          integrity: request.integrity,
        });

        event.respondWith(fetch(filteredRequest));
      }
    }
  }
});
