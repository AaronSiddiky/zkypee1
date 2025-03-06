/**
 * Test Scripts for Credit System Integration Endpoints
 *
 * How to use:
 * 1. Open your browser and navigate to your application
 * 2. Make sure you're logged in
 * 3. Open the browser console (F12 or right-click > Inspect > Console)
 * 4. Copy and paste this entire file into the console
 * 5. Call each test function as needed (e.g., testCreditCheck('+12223334444'))
 */

/**
 * Test the /api/credits/check endpoint with a given phone number
 * @param {string} phoneNumber - The phone number to check (with country code)
 */
async function testCreditCheck(phoneNumber = "+12025550123") {
  console.group("Testing Credit Check Endpoint (GET)");
  try {
    console.log(`Checking credits for phone number: ${phoneNumber}`);

    const response = await fetch(
      `/api/credits/check?phoneNumber=${encodeURIComponent(phoneNumber)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    console.log("Response status:", response.status);
    console.log("Response data:", data);

    if (response.ok) {
      console.log("Credit check successful!");
      console.log("Has enough credits:", data.hasEnoughCredits);
      console.log("Current balance:", data.currentBalance);
      console.log("Rate per minute:", data.ratePerMinute || data.rate);
      console.log("Estimated minutes:", data.estimatedMinutes);
    } else {
      console.error("Credit check failed:", data.error);
    }
  } catch (error) {
    console.error("Error testing credit check endpoint:", error);
  }
  console.groupEnd();
}

/**
 * Test the /api/credits/check endpoint with POST method
 * @param {string} phoneNumber - The phone number to check (with country code)
 */
async function testCreditCheckPost(phoneNumber = "+12025550123") {
  console.group("Testing Credit Check Endpoint (POST)");
  try {
    console.log(`Checking credits for phone number: ${phoneNumber}`);

    const response = await fetch("/api/credits/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phoneNumber }),
    });

    const data = await response.json();

    console.log("Response status:", response.status);
    console.log("Response data:", data);

    if (response.ok) {
      console.log("Credit check successful!");
      console.log("Has enough credits:", data.hasEnoughCredits);
      console.log("Current balance:", data.currentBalance);
      console.log("Rate per minute:", data.ratePerMinute || data.rate);
      console.log("Estimated minutes:", data.estimatedMinutes);
    } else {
      console.error("Credit check failed:", data.error);
    }
  } catch (error) {
    console.error("Error testing credit check endpoint:", error);
  }
  console.groupEnd();
}

/**
 * Test the /api/calls/history endpoint
 * @param {number} page - The page number to retrieve
 * @param {number} limit - The number of items per page
 */
async function testCallHistory(page = 1, limit = 10) {
  console.group("Testing Call History Endpoint");
  try {
    console.log(`Fetching call history (page: ${page}, limit: ${limit})`);

    const response = await fetch(
      `/api/calls/history?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    console.log("Response status:", response.status);
    console.log("Response data:", data);

    if (response.ok) {
      console.log("Call history retrieved successfully!");
      console.log("Total calls:", data.totalCalls);
      console.log("Has more pages:", data.hasMore);
      console.log("Calls on this page:", data.calls.length);

      if (data.calls.length > 0) {
        console.log("Sample call:", data.calls[0]);
      } else {
        console.log("No call history found.");
      }
    } else {
      console.error("Failed to retrieve call history:", data.error);
    }
  } catch (error) {
    console.error("Error testing call history endpoint:", error);
  }
  console.groupEnd();
}

/**
 * Get your current credit balance
 */
async function testCreditBalance() {
  console.group("Testing Credit Balance Endpoint");
  try {
    const response = await fetch("/api/credits/balance", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    console.log("Response status:", response.status);
    console.log("Response data:", data);

    if (response.ok) {
      console.log("Credit balance:", data.balance);
    } else {
      console.error("Failed to get credit balance:", data.error);
    }
  } catch (error) {
    console.error("Error testing credit balance endpoint:", error);
  }
  console.groupEnd();
}

/**
 * Run all tests with default parameters
 */
async function runAllTests() {
  console.group("Running All Credit System Integration Tests");

  // Test Credit Balance
  await testCreditBalance();

  // Test Credit Check (GET and POST)
  await testCreditCheck();
  await testCreditCheckPost();

  // Test Call History
  await testCallHistory();

  console.groupEnd();
  console.log("All tests completed!");
}

// Print available test functions
console.log(`
Credit System Integration Test Functions Available:

1. testCreditCheck(phoneNumber) - Test credit check endpoint (GET)
   Example: testCreditCheck('+12025550123')

2. testCreditCheckPost(phoneNumber) - Test credit check endpoint (POST)
   Example: testCreditCheckPost('+12025550123')

3. testCallHistory(page, limit) - Test call history endpoint
   Example: testCallHistory(1, 10)

4. testCreditBalance() - Test credit balance endpoint

5. runAllTests() - Run all tests with default parameters
`);
