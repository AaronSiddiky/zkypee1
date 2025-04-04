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
    <div className="min-h-screen bg-gradient-to-br from-[#00AFF0] to-[#0078D4] flex flex-col items-center justify-center p-4">
      {/* Decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-white/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Add Referral Code
          </h1>
          <p className="text-white/80">
            Enter a friend's referral code to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="referralCode" className="block text-sm font-medium text-white/90 mb-2">
              Referral Code
            </label>
            <input
              type="text"
              id="referralCode"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent backdrop-blur-sm"
              maxLength={5}
              placeholder="Enter 5-digit code"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-[#00AFF0] py-3 px-4 rounded-lg font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-[#00AFF0]"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#00AFF0]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Add Referral Code'
            )}
          </button>

          {message && (
            <div className={`p-4 rounded-lg ${
              message.includes('successfully') 
                ? 'bg-green-500/20 text-white border border-green-500/30' 
                : 'bg-red-500/20 text-white border border-red-500/30'
            }`}>
              <p className="text-sm text-center">{message}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
} 