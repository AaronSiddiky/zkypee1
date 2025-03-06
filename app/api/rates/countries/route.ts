import { NextRequest, NextResponse } from "next/server";
import { RateService } from "@/lib/rates/RateService";

/**
 * API endpoint to get list of all countries and their rates
 * GET /api/rates/countries
 * GET /api/rates/countries?continent=North America
 * GET /api/rates/countries?search=united
 */
export async function GET(request: NextRequest) {
  try {
    // Initialize rate service
    const rateService = RateService.getInstance();
    await rateService.initialize();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const continent = searchParams.get("continent");
    const search = searchParams.get("search");

    // Get all rates
    const allRates = rateService.getAllRates();

    // If search parameter is provided, filter by search term
    if (search && search.trim().length > 0) {
      const searchResults = rateService.searchCountries(search);
      return NextResponse.json({
        count: searchResults.length,
        countries: searchResults.map((rate) => ({
          ...rate,
          formattedRate: rateService.formatRateDisplay(rate.maxRate),
        })),
      });
    }

    // If continent parameter is provided, filter by continent
    if (continent) {
      const countriesByContinent = rateService.getCountriesByContinent();
      const continentRates = countriesByContinent[continent] || [];

      return NextResponse.json({
        continent,
        count: continentRates.length,
        countries: continentRates.map((rate) => ({
          ...rate,
          formattedRate: rateService.formatRateDisplay(rate.maxRate),
        })),
      });
    }

    // Otherwise, return all rates grouped by continent
    const countriesByContinent = rateService.getCountriesByContinent();
    const formattedResponse: Record<string, any> = {
      count: allRates.length,
      continents: {},
    };

    // Format the response
    Object.entries(countriesByContinent).forEach(([continent, rates]) => {
      formattedResponse.continents[continent] = {
        count: rates.length,
        countries: rates.map((rate) => ({
          ...rate,
          formattedRate: rateService.formatRateDisplay(rate.maxRate),
        })),
      };
    });

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error("Error fetching countries:", error);
    return NextResponse.json(
      { error: "Failed to fetch country rate data" },
      { status: 500 }
    );
  }
}
