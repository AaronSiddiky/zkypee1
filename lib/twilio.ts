// This is a placeholder for the actual Twilio API integration
// In a real implementation, these calls would go to your backend

type SupportedCountry = "US" | "CA" | "GB" | "AU" | "DE" | "FR" | "JP" | "BR";
type CountryCode = string;
type PhoneNumber = string;

interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  locality?: string;
  region?: string;
  price: number;
  capabilities: {
    voice?: boolean;
    sms?: boolean;
    mms?: boolean;
  };
}

export async function fetchAvailableCountries(): Promise<
  { code: string; name: string }[]
> {
  try {
    const response = await fetch("/api/twilio/countries");

    if (!response.ok) {
      throw new Error("Failed to fetch countries");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching countries:", error);
    throw error;
  }
}

export async function fetchAvailableNumbers(
  countryCode: CountryCode
): Promise<AvailableNumber[]> {
  try {
    const response = await fetch(
      `/api/twilio/numbers?countryCode=${countryCode}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch numbers for ${countryCode}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching numbers for ${countryCode}:`, error);
    throw error;
  }
}

function formatPhoneNumber(
  countryCode: CountryCode,
  number: PhoneNumber
): string {
  const numStr = number.toString();
  if (countryCode === "US") {
    return `+1 (${numStr.substring(0, 3)}) ${numStr.substring(
      3,
      6
    )}-${numStr.substring(6)}`;
  }
  return `+${countryCode} ${numStr}`;
}

function getRandomCity(countryCode: CountryCode): string {
  const cities: Record<SupportedCountry, string[]> = {
    US: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"],
    CA: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
    GB: ["London", "Manchester", "Birmingham", "Glasgow", "Liverpool"],
    AU: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
    DE: ["Berlin", "Munich", "Hamburg", "Cologne", "Frankfurt"],
    FR: ["Paris", "Marseille", "Lyon", "Toulouse", "Nice"],
    JP: ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Sapporo"],
    BR: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza"],
  };

  const countryCities = cities[countryCode as SupportedCountry] || [
    "Unknown City",
  ];
  return countryCities[Math.floor(Math.random() * countryCities.length)];
}

function getRandomRegion(countryCode: CountryCode): string {
  const regions: Record<SupportedCountry, string[]> = {
    US: ["California", "New York", "Texas", "Florida", "Illinois"],
    CA: ["Ontario", "British Columbia", "Quebec", "Alberta", "Manitoba"],
    GB: ["England", "Scotland", "Wales", "Northern Ireland"],
    AU: [
      "New South Wales",
      "Victoria",
      "Queensland",
      "Western Australia",
      "South Australia",
    ],
    DE: [
      "Bavaria",
      "North Rhine-Westphalia",
      "Baden-Württemberg",
      "Lower Saxony",
      "Hesse",
    ],
    FR: [
      "Île-de-France",
      "Provence-Alpes-Côte d'Azur",
      "Auvergne-Rhône-Alpes",
      "Occitanie",
      "Hauts-de-France",
    ],
    JP: ["Kanto", "Kansai", "Chubu", "Kyushu", "Tohoku"],
    BR: [
      "São Paulo",
      "Rio de Janeiro",
      "Minas Gerais",
      "Bahia",
      "Rio Grande do Sul",
    ],
  };

  const countryRegions = regions[countryCode as SupportedCountry] || [
    "Unknown Region",
  ];
  return countryRegions[Math.floor(Math.random() * countryRegions.length)];
}
