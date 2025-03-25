"use client";

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function AddReferralPage() {
  const [referralCode, setReferralCode] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage('Please log in first');
        return;
      }

      const referralCodeToCheck = referralCode.toUpperCase();
      
      // First, let's check if the user has credits
      const { data: userData } = await supabase
        .from('users')
        .select('credit_balance')
        .eq('id', user.id)
        .single();

      if (!userData || userData.credit_balance <= 0) {
        setMessage('You need to make a purchase before using a referral code');
        return;
      }

      // Check if user has already used a referral code
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referred_id', user.id)
        .single();

      if (existingReferral) {
        setMessage('You have already used a referral code');
        return;
      }

      // Check if referral code exists and get referrer
      const { data: referrer, error: referrerError } = await supabase
        .from('users')
        .select('id, referral_code')
        .eq('referral_code', referralCodeToCheck);

      if (!referrer || !referrer.length) {
        setMessage('Invalid referral code. Please check and try again.');
        return;
      }

      // Get the first matching referrer
      const referrerUser = referrer[0];

      // Prevent self-referral
      if (referrerUser.id === user.id) {
        setMessage('You cannot use your own referral code');
        return;
      }

      // Add referral record
      const { error: referralError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrerUser.id,
          referred_id: user.id
        });

      if (referralError) {
        if (referralError.code === '23505' || referralError.code === '409') {
          setMessage('This referral relationship already exists.');
        } else {
          setMessage('Unable to add referral code. Please try again.');
        }
        return;
      }

      // Update referrer's stats since the referred user has credits
      const { error: updateError } = await supabase.rpc('increment_referral_count', {
        user_id: referrerUser.id
      });

      if (updateError) {
        setMessage('Unable to update referral count. Please contact support.');
        return;
      }

      setMessage('Referral code added successfully!');
      router.refresh();
    } catch (error) {
      setMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Add Referral Code
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 mb-1">
              Enter Referral Code
            </label>
            <input
              type="text"
              id="referralCode"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              maxLength={5}
              placeholder="XXXXX"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Adding...' : 'Add Referral Code'}
          </button>

          {message && (
            <p className={`text-sm text-center ${
              message.includes('successfully') ? 'text-green-600' : 'text-red-600'
            }`}>
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
} 