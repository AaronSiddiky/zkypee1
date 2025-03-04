import React from 'react';
import Image from 'next/image';

interface CountryCardProps {
  country: {
    countryCode: string;
    countryName: string;
    flagUrl?: string;
  };
  onClick: () => void;
  isSelected: boolean;
}

export default function CountryCard({ country, onClick, isSelected }: CountryCardProps) {
  return (
    <div 
      className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        {country.flagUrl && (
          <div className="w-8 h-6 relative overflow-hidden rounded">
            <Image 
              src={country.flagUrl} 
              alt={`${country.countryName} flag`}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <div>
          <h3 className="font-medium">{country.countryName}</h3>
          <p className="text-sm text-gray-500">{country.countryCode}</p>
        </div>
      </div>
    </div>
  );
} 