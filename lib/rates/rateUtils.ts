import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

// Types for our rate system
export interface CountryRate {
  continent: string;
  country: string;
  countryCode: string;
  minRate: number;
  maxRate: number;
  formattedCode: string; // Cleaned code for easier lookup
}

export interface RateLookupResult {
  found: boolean;
  rate: number;
  country?: string;
  countryCode?: string;
  formattedNumber?: string;
}

// Parse a price range like "$0.377-$0.604" to get min and max rates
function parseRateRange(rateString: string): {
  minRate: number;
  maxRate: number;
} {
  // Remove all $ signs and split by dash
  const cleanedRate = rateString.replace(/\$/g, "");
  const parts = cleanedRate.split("-");

  // If there's only one part, use it for both min and max
  if (parts.length === 1) {
    const rate = parseFloat(parts[0]);
    return { minRate: rate, maxRate: rate };
  }

  // Otherwise, parse min and max
  return {
    minRate: parseFloat(parts[0]),
    maxRate: parseFloat(parts[1]),
  };
}

// Clean country code for better lookup
function cleanCountryCode(code: string): string {
  // Remove spaces, parentheses, and + sign
  return (
    code
      .replace(/[\s\(\)\+]/g, "")
      // Remove "1-" prefix from North American codes
      .replace(/^1-/, "")
      // Split multiple codes and take the first one
      .split(",")[0]
  );
}

// Parse the rates CSV file
export function parseRatesCSV(): CountryRate[] {
  try {
    // Read the CSV file
    const csvPath = path.join(process.cwd(), "rates.csv");
    const fileContent = fs.readFileSync(csvPath, "utf8");

    // Parse the CSV content
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    // Transform the data
    const rates: CountryRate[] = records.map((record: any) => {
      const { minRate, maxRate } = parseRateRange(record["Price/Minute"]);
      const formattedCode = cleanCountryCode(record["Country Code"]);

      return {
        continent: record["Continent"],
        country: record["Country"],
        countryCode: record["Country Code"],
        minRate,
        maxRate,
        formattedCode,
      };
    });

    return rates;
  } catch (error) {
    console.error("Error parsing rates CSV:", error);
    return [];
  }
}

// Get rate information by looking up a country code or phone number
export function getRateByNumber(
  phoneNumberOrCode: string,
  rates: CountryRate[]
): RateLookupResult {
  console.log(`[getRateByNumber] Processing: "${phoneNumberOrCode}"`);

  // Validate input
  if (!phoneNumberOrCode || phoneNumberOrCode.length < 3) {
    console.warn(
      `[getRateByNumber] Invalid phone number (too short): "${phoneNumberOrCode}"`
    );
    return {
      found: false,
      rate: 0.5, // Default high rate for invalid numbers
      country: "Unknown",
      countryCode: "Invalid",
    };
  }

  // Clean up the input
  const input = phoneNumberOrCode.replace(/[\s\(\)\+\-]/g, "");
  console.log(`[getRateByNumber] Cleaned input: "${input}"`);

  // If the input is too short after cleaning, it's likely invalid
  if (input.length < 2) {
    console.warn(
      `[getRateByNumber] Input too short after cleaning: "${input}"`
    );
    return {
      found: false,
      rate: 0.5,
      country: "Unknown",
      countryCode: "Invalid",
    };
  }

  // Try to find a match
  for (const rate of rates) {
    if (
      input.startsWith(rate.formattedCode) ||
      input.includes(rate.formattedCode)
    ) {
      // Use the higher rate to be safe
      console.log(
        `[getRateByNumber] Found match: ${rate.country} (${rate.countryCode}), rate: ${rate.maxRate}`
      );
      return {
        found: true,
        rate: rate.maxRate,
        country: rate.country,
        countryCode: rate.countryCode,
        formattedNumber: `+${rate.formattedCode}${input.substring(
          rate.formattedCode.length
        )}`,
      };
    }
  }

  // Try to extract country code via prefix matching
  // Common prefix lengths are 1 (US/Canada), 2 (Mexico), and 3 (most others)
  let prefixLengths = [3, 2, 1];
  for (const prefixLength of prefixLengths) {
    if (input.length >= prefixLength) {
      const prefix = input.substring(0, prefixLength);
      for (const rate of rates) {
        if (rate.formattedCode.startsWith(prefix)) {
          console.log(
            `[getRateByNumber] Found prefix match: ${prefix} → ${rate.country}, rate: ${rate.maxRate}`
          );
          return {
            found: true,
            rate: rate.maxRate,
            country: rate.country,
            countryCode: rate.countryCode,
            formattedNumber: `+${rate.formattedCode}${input.substring(
              prefixLength
            )}`,
          };
        }
      }
    }
  }

  // Default to a higher rate if no match found
  console.warn(`[getRateByNumber] No match found for: "${input}"`);
  return {
    found: false,
    rate: 0.5, // Default high rate for unknown destinations
    country: "Unknown",
    countryCode: "Unknown",
  };
}

// Calculate cost for a given duration
export function calculateCallCost(
  rate: number,
  durationMinutes: number
): number {
  // Round up to the nearest minute (or any other billing increment)
  const billedMinutes = Math.ceil(durationMinutes);
  return parseFloat((rate * billedMinutes).toFixed(2));
}

// Calculate how many minutes a user can call with given credits
export function calculatePotentialDuration(
  rate: number,
  availableCredits: number
): number {
  if (rate <= 0) return 0;
  return Math.floor(availableCredits / rate);
}

// Get all countries grouped by continent
export function getCountriesByContinent(
  rates: CountryRate[]
): Record<string, CountryRate[]> {
  const result: Record<string, CountryRate[]> = {};

  rates.forEach((rate) => {
    if (!result[rate.continent]) {
      result[rate.continent] = [];
    }
    result[rate.continent].push(rate);
  });

  return result;
}
