"use client";

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';

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
        console.error('Error loading referral data:', error);
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
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00AFF0] to-[#0078D4] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00AFF0] to-[#0078D4] p-4 md:p-8">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-white/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[#00AFF0]/90 to-[#0078D4]/90 backdrop-blur-lg rounded-2xl p-8 text-white shadow-xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Earn $1 for Every Paid User You Refer
          </h1>
          <p className="text-lg md:text-xl text-white/90">
            Share Zkypee with your friends and earn rewards when they become paid users.
          </p>
        </div>

        {/* Stats Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Your Referral Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white/5 rounded-xl border border-white/10">
              <p className="text-sm text-white/80 mb-1">Total Referrals</p>
              <p className="text-4xl font-bold text-white">{totalReferrals}</p>
            </div>
            <div className="p-6 bg-white/5 rounded-xl border border-white/10">
              <p className="text-sm text-white/80 mb-1">Total Earnings</p>
              <p className="text-4xl font-bold text-white">${totalReferrals}.00</p>
            </div>
          </div>
        </div>

        {/* Share Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Your Referral Code</h2>
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-white/5 px-8 py-4 rounded-xl border-2 border-white/20">
              <span className="text-3xl md:text-4xl font-mono font-bold tracking-wider text-white">
                {referralCode || '-----'}
              </span>
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center space-x-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors"
            >
              {copied ? (
                <CheckIcon className="h-5 w-5" />
              ) : (
                <ClipboardIcon className="h-5 w-5" />
              )}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-white mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold">1</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Share Your Code</h3>
              <p className="text-white/80 text-sm">
                Share your unique 5-digit referral code with friends
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold">2</span>
              </div>
              <h3 className="font-semibold text-white mb-2">They Make a Purchase</h3>
              <p className="text-white/80 text-sm">
                Friends sign up and add credits to their account
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold">3</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Earn Rewards</h3>
              <p className="text-white/80 text-sm">
                When they add your referral code, you instantly earn $1
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 