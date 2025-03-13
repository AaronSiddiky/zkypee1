import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

// Types for our rate system
interface CountryRate {
  continent: string;
  country: string;
  countryCode: string;
  minRate: number;
  maxRate: number;
  formattedCode: string;
}

interface RateLookupResult {
  found: boolean;
  rate: number;
  country?: string;
  countryCode?: string;
  formattedNumber?: string;
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

// Parse the rates CSV file
function parseRatesCSV(): CountryRate[] {
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
function getRateByNumber(
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

  // Special handling for North American numbers (US/Canada)
  // If the number starts with 1, it's a North American number
  if (input.startsWith("1")) {
    // Find the United States/Canada rate entry
    const usCanadaRate = rates.find(
      (rate) =>
        rate.country === "United States/Canada" && rate.countryCode === "(+1)"
    );

    if (usCanadaRate) {
      console.log(
        `[getRateByNumber] Found North American number: ${input}, using US/Canada rate: ${usCanadaRate.minRate}`
      );
      return {
        found: true,
        rate: usCanadaRate.minRate,
        country: usCanadaRate.country,
        countryCode: usCanadaRate.countryCode,
        formattedNumber: `+1${input.substring(1)}`,
      };
    }
  }

  // Try to find a match
  for (const rate of rates) {
    if (
      input.startsWith(rate.formattedCode) ||
      input.includes(rate.formattedCode)
    ) {
      // Use the lower rate for better user value
      console.log(
        `[getRateByNumber] Found match: ${rate.country} (${rate.countryCode}), rate: ${rate.minRate}`
      );
      return {
        found: true,
        rate: rate.minRate,
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
            `[getRateByNumber] Found prefix match: ${prefix} → ${rate.country}, rate: ${rate.minRate}`
          );
          return {
            found: true,
            rate: rate.minRate,
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

// API route handler
export async function GET(req: NextRequest) {
  // Get phone number from query
  const url = new URL(req.url);
  const phoneNumber = url.searchParams.get("phoneNumber");

  if (!phoneNumber) {
    return NextResponse.json(
      {
        success: false,
        error: "Phone number is required",
      },
      { status: 400 }
    );
  }

  try {
    // Parse rates and get rate for the phone number
    const rates = parseRatesCSV();
    const rateInfo = getRateByNumber(phoneNumber, rates);

    return NextResponse.json({
      success: true,
      ...rateInfo,
    });
  } catch (error) {
    console.error("Error getting rate:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to lookup rate",
        rate: 0.5, // Default fallback rate
      },
      { status: 500 }
    );
  }
}
