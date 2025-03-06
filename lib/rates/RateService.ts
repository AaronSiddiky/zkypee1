import {
  parseRatesCSV,
  CountryRate,
  getRateByNumber,
  calculateCallCost,
  calculatePotentialDuration,
  getCountriesByContinent,
  RateLookupResult,
} from "./rateUtils";

/**
 * Service for managing call rates and cost calculations
 */
export class RateService {
  private static instance: RateService;
  private rates: CountryRate[] = [];
  private countriesByContinent: Record<string, CountryRate[]> = {};
  private initialized: boolean = false;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Initialize the rate service
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    this.rates = parseRatesCSV();
    this.countriesByContinent = getCountriesByContinent(this.rates);
    this.initialized = true;

    console.log(
      `Rate service initialized with ${this.rates.length} country rates`
    );
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): RateService {
    if (!RateService.instance) {
      RateService.instance = new RateService();
    }
    return RateService.instance;
  }

  /**
   * Get rate information for a phone number or country code
   */
  public getRateByNumber(phoneNumberOrCode: string): RateLookupResult {
    if (!this.initialized) {
      this.initialize();
    }
    return getRateByNumber(phoneNumberOrCode, this.rates);
  }

  /**
   * Calculate call cost for a given rate and duration
   */
  public calculateCallCost(rate: number, durationMinutes: number): number {
    return calculateCallCost(rate, durationMinutes);
  }

  /**
   * Calculate how many minutes a user can call with their available credits
   */
  public calculatePotentialDuration(
    rate: number,
    availableCredits: number
  ): number {
    return calculatePotentialDuration(rate, availableCredits);
  }

  /**
   * Get all countries grouped by continent
   */
  public getCountriesByContinent(): Record<string, CountryRate[]> {
    if (!this.initialized) {
      this.initialize();
    }
    return this.countriesByContinent;
  }

  /**
   * Get all rates as a flat array
   */
  public getAllRates(): CountryRate[] {
    if (!this.initialized) {
      this.initialize();
    }
    return this.rates;
  }

  /**
   * Get a formatted rate display string
   */
  public formatRateDisplay(rate: number): string {
    return `$${rate.toFixed(2)}/min`;
  }

  /**
   * Find countries that match a search term
   */
  public searchCountries(searchTerm: string): CountryRate[] {
    if (!this.initialized) {
      this.initialize();
    }

    const term = searchTerm.toLowerCase();
    return this.rates.filter(
      (rate) =>
        rate.country.toLowerCase().includes(term) ||
        rate.countryCode.toLowerCase().includes(term)
    );
  }
}
