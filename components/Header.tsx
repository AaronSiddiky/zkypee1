import React from 'react';
import { UserCredits } from '../app/(home)/layout';

export default function Header() {
  return (
    <header className="bg-white shadow-sm py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-800">Zkypee</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <UserCredits />
          {/* Other header elements like navigation, profile, etc. */}
        </div>
      </div>
    </header>
  );
} 