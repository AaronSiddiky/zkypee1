# Credit System Integration Testing Tools

This directory contains tools for testing the credit system integration endpoints.

## Files in this directory:

### 1. `test-credit-endpoints.js`

JavaScript file with functions that can be run directly in the browser console to test the credit system API endpoints.

**How to use:**

1. Open your browser and navigate to your application
2. Make sure you're logged in
3. Open the browser console (F12 or right-click > Inspect > Console)
4. Copy and paste the entire file content into the console
5. Call the test functions as needed:
   - `testCreditCheck('+12025550123')` - Test credit check endpoint (GET)
   - `testCreditCheckPost('+12025550123')` - Test credit check endpoint (POST)
   - `testCallHistory(1, 10)` - Test call history endpoint
   - `testCreditBalance()` - Test credit balance endpoint
   - `runAllTests()` - Run all tests with default parameters

### 2. `endpoint-tester.html`

A standalone HTML page with a user interface for testing the credit system API endpoints.

**How to use:**

1. Open this file in a web browser
2. Make sure you're on the same domain as your application or handle CORS appropriately
3. Use the interface to test individual endpoints or run all tests
4. Review the JSON responses displayed on the page

## API Endpoints Tested:

1. **Credit Balance** - `/api/credits/balance`

   - Retrieves the current credit balance for the authenticated user

2. **Credit Check** - `/api/credits/check`

   - Checks if a user has enough credits to call a specific phone number
   - Provides detailed information about call rates and estimated talk time
   - Supports both GET and POST methods

3. **Call History** - `/api/calls/history`
   - Retrieves the call history for the authenticated user
   - Supports pagination with page and limit parameters

## Testing Tips:

- Always ensure you're properly authenticated before running tests
- Test with various phone numbers from different countries to verify rate calculations
- Check both success and error scenarios
- Verify that the pagination in call history works correctly
