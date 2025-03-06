// Simple test script for the rates API
const axios = require("axios");

// Base URL for local development
const API_BASE_URL = "http://localhost:3000/api";

async function testRatesAPI() {
  console.log("Testing Rates API...");
  console.log("=====================");

  // Test looking up a specific number
  try {
    console.log("\n1. Testing rate lookup for US number:");
    const lookupResponse = await axios.get(
      `${API_BASE_URL}/rates/lookup?number=+12125551234`
    );
    console.log("Response:", JSON.stringify(lookupResponse.data, null, 2));
  } catch (error) {
    console.error(
      "Error testing lookup:",
      error.response?.data || error.message
    );
  }

  // Test looking up a UK number
  try {
    console.log("\n2. Testing rate lookup for UK number:");
    const ukLookupResponse = await axios.get(
      `${API_BASE_URL}/rates/lookup?number=+447700900123`
    );
    console.log("Response:", JSON.stringify(ukLookupResponse.data, null, 2));
  } catch (error) {
    console.error(
      "Error testing UK lookup:",
      error.response?.data || error.message
    );
  }

  // Test countries list endpoint
  try {
    console.log("\n3. Testing countries list API:");
    const countriesResponse = await axios.get(
      `${API_BASE_URL}/rates/countries`
    );

    // Just show summary info to avoid overwhelming output
    const countryCount = countriesResponse.data.count;
    const continents = Object.keys(countriesResponse.data.continents);

    console.log(
      `Found ${countryCount} countries across ${continents.length} continents:`
    );
    continents.forEach((continent) => {
      const countries = countriesResponse.data.continents[continent].countries;
      console.log(`- ${continent}: ${countries.length} countries`);
    });
  } catch (error) {
    console.error(
      "Error testing countries API:",
      error.response?.data || error.message
    );
  }

  // Test continent filter
  try {
    console.log("\n4. Testing continent filter (North America):");
    const continentResponse = await axios.get(
      `${API_BASE_URL}/rates/countries?continent=North America`
    );
    console.log(
      `Found ${continentResponse.data.count} countries in North America`
    );

    // Show first 5 countries as an example
    const exampleCountries = continentResponse.data.countries.slice(0, 5);
    console.log(
      "Example countries:",
      exampleCountries.map(
        (c) => `${c.country} (${c.countryCode}): ${c.formattedRate}`
      )
    );
  } catch (error) {
    console.error(
      "Error testing continent filter:",
      error.response?.data || error.message
    );
  }

  // Test search functionality
  try {
    console.log("\n5. Testing search functionality (india):");
    const searchResponse = await axios.get(
      `${API_BASE_URL}/rates/countries?search=india`
    );
    console.log(
      "Search results:",
      JSON.stringify(searchResponse.data, null, 2)
    );
  } catch (error) {
    console.error(
      "Error testing search:",
      error.response?.data || error.message
    );
  }
}

// Run the tests
testRatesAPI()
  .then(() => console.log("\nTests completed"))
  .catch((err) => console.error("Test failed:", err));
