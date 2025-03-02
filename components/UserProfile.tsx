"use client";

import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function UserProfile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 w-full max-w-md">
      <h2 className="text-xl font-bold mb-4">Your Profile</h2>
      <div className="mb-2">
        <span className="font-medium">Email:</span> {user.email}
      </div>
      <div className="mb-2">
        <span className="font-medium">User ID:</span> {user.id.substring(0, 8)}...
      </div>
      <div className="mb-2">
        <span className="font-medium">Last Sign In:</span> {new Date(user.last_sign_in_at || '').toLocaleString()}
      </div>
    </div>
  );
} 