import { NextResponse } from 'next/server';
import twilio from 'twilio';

// Initialize Twilio client with your credentials
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Our markup configuration
const FIXED_MARKUP = 0.30; // $0.30 fixed markup

// Cache for pricing information to avoid repeated API calls
const pricingCache = new Map();

// Special handling for certain countries
const countrySpecificConfig = {
  'IT': {
    // Italy sometimes needs specific parameters to find numbers
    localParams: {
      limit: 20,
      voiceEnabled: true,
      smsEnabled: true, // Adding SMS capability might help find more numbers
    },
    // For Italy, we might need to try different regions
    regions: ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo']
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const countryCode = searchParams.get('countryCode');
  
  if (!countryCode) {
    return NextResponse.json(
      { error: 'Country code is required' },
      { status: 400 }
    );
  }
  
  try {
    // First, get the pricing information for this country
    let countryPricing;
    
    // Check if we have cached pricing for this country
    if (pricingCache.has(countryCode)) {
      countryPricing = pricingCache.get(countryCode);
    } else {
      // Fetch pricing information from Twilio's Pricing API
      try {
        const pricingInfo = await client.pricing.v1.phoneNumbers
          .countries(countryCode)
          .fetch();
        
        // Transform the pricing data into a more usable format
        countryPricing = {};
        
        if (pricingInfo && pricingInfo.phoneNumberPrices) {
          pricingInfo.phoneNumberPrices.forEach(price => {
            // Convert from string to number and from USD to a numeric value
            const monthlyPrice = parseFloat(price.currentPrice);
            countryPricing[price.numberType.toLowerCase()] = monthlyPrice;
          });
        }
        
        // Cache the pricing information
        pricingCache.set(countryCode, countryPricing);
      } catch (error) {
        console.error(`Error fetching pricing for ${countryCode}:`, error);
        // If we can't get pricing, use a default value
        countryPricing = { local: 1.00, tollFree: 2.00, mobile: 1.50 };
      }
    }
    
    // Now fetch available phone numbers
    let phoneNumbers = [];
    
    try {
      // Get country-specific parameters if available
      const countryConfig = countrySpecificConfig[countryCode] || {};
      const localParams = countryConfig.localParams || {
        limit: 10,
        voiceEnabled: true
      };
      
      // Search for local numbers
      const localNumbers = await client.availablePhoneNumbers(countryCode)
        .local
        .list(localParams);
      
      phoneNumbers = [...phoneNumbers, ...localNumbers];
      
      // If we didn't find any numbers and there are specific regions to try
      if (localNumbers.length === 0 && countryConfig.regions) {
        // Try each region
        for (const region of countryConfig.regions) {
          try {
            const regionNumbers = await client.availablePhoneNumbers(countryCode)
              .local
              .list({
                ...localParams,
                inRegion: region
              });
            
            phoneNumbers = [...phoneNumbers, ...regionNumbers];
            
            // If we found some numbers, we can stop searching
            if (regionNumbers.length > 0) {
              break;
            }
          } catch (regionError) {
            console.log(`Error fetching numbers for ${countryCode} in region ${region}:`, regionError);
          }
        }
      }
    } catch (error) {
      console.log(`Error fetching local numbers for ${countryCode}:`, error);
    }
    
    // Also try toll-free numbers
    try {
      const tollFreeNumbers = await client.availablePhoneNumbers(countryCode)
        .tollFree
        .list({
          limit: 5,
          voiceEnabled: true,
        });
      
      phoneNumbers = [...phoneNumbers, ...tollFreeNumbers];
    } catch (error) {
      console.log(`Error fetching toll-free numbers for ${countryCode}:`, error);
    }
    
    // For some countries, also try mobile numbers
    try {
      const mobileNumbers = await client.availablePhoneNumbers(countryCode)
        .mobile
        .list({
          limit: 5,
          voiceEnabled: true,
        });
      
      phoneNumbers = [...phoneNumbers, ...mobileNumbers];
    } catch (error) {
      console.log(`Error fetching mobile numbers for ${countryCode}:`, error);
    }
    
    // If we couldn't get any real numbers, return an empty array
    if (phoneNumbers.length === 0) {
      return NextResponse.json([]);
    }
    
    // Transform the data to match our expected format
    const formattedNumbers = phoneNumbers.map(number => {
      // Extract capabilities
      const capabilities = {
        voice: number.capabilities?.voice || false,
        sms: number.capabilities?.sms || false,
        mms: number.capabilities?.mms || false,
      };
      
      // Determine number type and get the base price from Twilio's pricing API
      let numberType = 'local';
      
      // Check for toll-free numbers
      if (number.phoneNumber.startsWith('+1800') || 
          number.phoneNumber.startsWith('+1888') || 
          number.phoneNumber.startsWith('+1877') || 
          number.phoneNumber.startsWith('+1866') ||
          number.phoneNumber.startsWith('+1855') ||
          number.phoneNumber.startsWith('+1844') ||
          number.phoneNumber.includes('toll-free')) {
        numberType = 'tollFree';
      } 
      // Check for mobile numbers
      else if (number.phoneNumber.match(/\+\d+[67]\d+/) || 
               number.capabilities?.MMS || 
               number.phoneNumber.includes('mobile')) {
        numberType = 'mobile';
      }
      
      // Get the base price from our pricing data
      let basePrice = countryPricing[numberType] || 1.00; // Default to $1 if no pricing found
      
      // Apply our fixed markup
      const finalPrice = basePrice + FIXED_MARKUP;
      
      // Format the display type (capitalize first letter)
      const displayType = numberType.charAt(0).toUpperCase() + numberType.slice(1);
      
      return {
        phoneNumber: number.phoneNumber,
        friendlyName: number.friendlyName || formatPhoneNumber(number.phoneNumber),
        locality: number.locality || 'Unknown City',
        region: number.region || 'Unknown Region',
        price: finalPrice.toFixed(2),
        capabilities,
        numberType: displayType,
      };
    });
    
    return NextResponse.json(formattedNumbers);
  } catch (error) {
    console.error(`Error fetching numbers for ${countryCode}:`, error);
    
    // Return an empty array if there's an error
    return NextResponse.json([]);
  }
}

// Helper function to format phone numbers
function formatPhoneNumber(phoneNumber) {
  // Remove any non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Format based on length
  if (digits.length === 10) {
    return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
  } else if (digits.length > 10) {
    return `+${digits.substring(0, digits.length - 10)} (${digits.substring(digits.length - 10, digits.length - 7)}) ${digits.substring(digits.length - 7, digits.length - 4)}-${digits.substring(digits.length - 4)}`;
  }
  
  // If we can't format it, return as is
  return phoneNumber;
} 