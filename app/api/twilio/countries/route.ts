import { NextResponse } from 'next/server';
import twilio from 'twilio';

// Initialize Twilio client with your credentials
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function GET() {
  try {
    // Fetch available phone number countries from Twilio
    const countries = await client.availablePhoneNumbers.list();
    
    // Log the countries we get from Twilio to help debug
    console.log("Countries from Twilio API:", countries.map(c => c.countryCode));
    
    // Make sure Italy is included
    let hasItaly = countries.some(country => country.countryCode === 'IT');
    
    // Create the base list of countries
    let allCountries = countries.map(country => ({
      countryCode: country.countryCode,
      countryName: country.country,
      flagUrl: `https://flagcdn.com/${country.countryCode.toLowerCase()}.svg`
    }));
    
    // If Italy is missing, add it manually
    if (!hasItaly) {
      console.log("Italy was missing, adding it manually");
      allCountries.push({
        countryCode: 'IT',
        countryName: 'Italy',
        flagUrl: 'https://flagcdn.com/it.svg'
      });
    }
    
    // Add any other countries that might be missing but should be available
    const additionalCountries = [
      // Only add countries that Twilio actually supports but might not be returned by the API
      { countryCode: 'ES', countryName: 'Spain', flagUrl: 'https://flagcdn.com/es.svg' },
      { countryCode: 'NL', countryName: 'Netherlands', flagUrl: 'https://flagcdn.com/nl.svg' },
      { countryCode: 'SE', countryName: 'Sweden', flagUrl: 'https://flagcdn.com/se.svg' },
      { countryCode: 'CH', countryName: 'Switzerland', flagUrl: 'https://flagcdn.com/ch.svg' },
      { countryCode: 'BE', countryName: 'Belgium', flagUrl: 'https://flagcdn.com/be.svg' },
      { countryCode: 'AT', countryName: 'Austria', flagUrl: 'https://flagcdn.com/at.svg' },
      { countryCode: 'PL', countryName: 'Poland', flagUrl: 'https://flagcdn.com/pl.svg' },
      { countryCode: 'NO', countryName: 'Norway', flagUrl: 'https://flagcdn.com/no.svg' },
      { countryCode: 'DK', countryName: 'Denmark', flagUrl: 'https://flagcdn.com/dk.svg' },
      { countryCode: 'FI', countryName: 'Finland', flagUrl: 'https://flagcdn.com/fi.svg' },
      { countryCode: 'IE', countryName: 'Ireland', flagUrl: 'https://flagcdn.com/ie.svg' },
      { countryCode: 'PT', countryName: 'Portugal', flagUrl: 'https://flagcdn.com/pt.svg' },
      { countryCode: 'GR', countryName: 'Greece', flagUrl: 'https://flagcdn.com/gr.svg' },
    ];
    
    // Add the additional countries, but only if they're not already in the list
    for (const country of additionalCountries) {
      if (!allCountries.some(c => c.countryCode === country.countryCode)) {
        allCountries.push(country);
      }
    }
    
    // Remove duplicates (in case a country appears in both lists)
    const uniqueCountries = Array.from(
      new Map(allCountries.map(country => [country.countryCode, country])).values()
    );
    
    // Sort alphabetically by country name
    uniqueCountries.sort((a, b) => a.countryName.localeCompare(b.countryName));
    
    return NextResponse.json(uniqueCountries);
  } catch (error) {
    console.error('Error fetching countries from Twilio:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    );
  }
} 