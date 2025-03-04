import React, { useState, useEffect } from 'react';
import Button from './Button';
import { fetchAvailableNumbers } from '../lib/twilio';

interface NumberListProps {
  countryCode: string;
}

export default function NumberList({ countryCode }: NumberListProps) {
  const [numbers, setNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNumber, setSelectedNumber] = useState(null);

  useEffect(() => {
    async function loadNumbers() {
      try {
        setLoading(true);
        setSelectedNumber(null); // Reset selected number when country changes
        const availableNumbers = await fetchAvailableNumbers(countryCode);
        setNumbers(availableNumbers);
      } catch (err) {
        console.error(`Failed to load numbers for ${countryCode}:`, err);
        setError("Failed to load available numbers. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadNumbers();
  }, [countryCode]);

  function handleBuyNumber(number) {
    setSelectedNumber(number);
    // In Phase 2, this would initiate the purchase flow
    console.log('Selected number for purchase:', number);
    alert(`Number ${number.friendlyName} selected. Purchase functionality will be implemented in phase 2.`);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (numbers.length === 0) {
    return (
      <div className="text-center py-8 bg-yellow-50 border border-yellow-100 rounded-lg p-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-yellow-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-lg font-medium text-yellow-800 mb-2">No Numbers Available</h3>
        <p className="text-yellow-600">
          Twilio doesn't currently have any phone numbers available for this country. 
          Please try selecting a different country.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {numbers.map((number) => (
        <div 
          key={number.phoneNumber} 
          className={`border rounded-lg p-4 transition-all duration-200 ${
            selectedNumber?.phoneNumber === number.phoneNumber 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <p className="font-medium text-lg">{number.friendlyName}</p>
            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
              {number.numberType || 'Local'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-2">{number.locality || number.region || 'Unknown location'}</p>
          
          {/* Capabilities */}
          <div className="flex space-x-2 mb-3">
            {number.capabilities?.voice && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">Voice</span>
            )}
            {number.capabilities?.sms && (
              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">SMS</span>
            )}
            {number.capabilities?.mms && (
              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">MMS</span>
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-blue-500 font-medium">${number.price}/month</span>
            <Button 
              variant={selectedNumber?.phoneNumber === number.phoneNumber ? "secondary" : "primary"}
              size="small"
              onClick={() => handleBuyNumber(number)}
            >
              {selectedNumber?.phoneNumber === number.phoneNumber ? "Selected" : "Buy"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
} 