"use client";

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function EarnPage() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    async function loadReferralData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return;
        }

        // Get user's referral data
        const { data: userData, error } = await supabase
          .from('users')
          .select('referral_code, total_referrals')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        // If no referral code exists, generate one
        if (!userData.referral_code) {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          let code;
          let attempts = 0;
          const maxAttempts = 10;

          while (attempts < maxAttempts) {
            code = '';
            for (let i = 0; i < 5; i++) {
              code += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            // Check if code exists
            const { data: existing } = await supabase
              .from('users')
              .select('referral_code')
              .eq('referral_code', code)
              .single();

            if (!existing) {
              // Update user with new code
              const { error: updateError } = await supabase
                .from('users')
                .update({ referral_code: code })
                .eq('id', user.id);

              if (!updateError) {
                setReferralCode(code);
                break;
              }
            }

            attempts++;
          }

          if (attempts >= maxAttempts) {
            // Silently fail, user will see empty state UI
          }
        } else {
          setReferralCode(userData.referral_code);
        }
        
        setTotalReferrals(userData.total_referrals || 0);
      } catch (error) {
        // Silently handle error, user will see empty state UI
      } finally {
        setLoading(false);
      }
    }

    loadReferralData();
  }, []);

  const copyToClipboard = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Silently fail, user will see the copy button still enabled
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-4">
            Earn $1 for Every Paid User You Refer
          </h1>
          <p className="text-lg opacity-90">
            Share Zkypee with your friends and earn rewards when they become paid users.
          </p>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Your Referral Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Referrals</p>
              <p className="text-3xl font-bold text-gray-900">{totalReferrals}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Earnings</p>
              <p className="text-3xl font-bold text-green-600">${totalReferrals}.00</p>
            </div>
          </div>
        </div>

        {/* Share Section */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Your Referral Code</h2>
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-gray-50 px-8 py-4 rounded-lg border-2 border-blue-100">
              <span className="text-3xl font-mono font-bold tracking-wider text-gray-900">
                {referralCode || '-----'}
              </span>
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2">Share Your Code</h3>
              <p className="text-gray-600 text-sm">
                Share your unique 5-digit referral code with friends
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2">They Make a Purchase</h3>
              <p className="text-gray-600 text-sm">
                Friends sign up and add credits to their account
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2">Earn Rewards</h3>
              <p className="text-gray-600 text-sm">
                When they add your referral code, you instantly earn $1
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 