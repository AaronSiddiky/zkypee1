"use client";

import React, { useState, useEffect } from "react";
import Button from "../../components/Button";
import {
  fetchAvailableCountries,
  fetchAvailableNumbers,
} from "../../lib/twilio";
import CountryCard from "../../components/CountryCard";
import NumberList from "../../components/NumberList";

export default function BuyNumberPage() {
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadCountries() {
      try {
        setLoading(true);
        const availableCountries = await fetchAvailableCountries();
        setCountries(availableCountries);
      } catch (err) {
        console.error("Failed to load countries:", err);
        setError("Failed to load available countries. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadCountries();
  }, []);

  // Filter countries based on search query
  const filteredCountries = countries.filter(
    (country) =>
      country.countryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.countryCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-blue-500">
        Buy a Phone Number
      </h1>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <p className="mb-6">
            Select a country to view available phone numbers:
          </p>

          {/* Search input */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search countries..."
              className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Country grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <CountryCard
                  key={country.countryCode}
                  country={country}
                  onClick={() => setSelectedCountry(country)}
                  isSelected={
                    selectedCountry?.countryCode === country.countryCode
                  }
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                No countries found matching your search.
              </div>
            )}
          </div>

          {/* Selected country numbers */}
          {selectedCountry && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">
                Available Numbers in {selectedCountry.countryName}
              </h2>
              <NumberList countryCode={selectedCountry.countryCode} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
