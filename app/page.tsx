"use client";

import React from 'react';
import PhoneDialer from '../components/PhoneDialer';
import { useAuth } from '../contexts/AuthContext';

export default function HomePage() {
  const { user, signOut } = useAuth();

  return (
    <main className="min-h-screen p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-md flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Zkypee Phone</h1>
        {user && (
          <button 
            onClick={signOut}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Sign Out
          </button>
        )}
      </div>
      <PhoneDialer />
    </main>
  );
} 