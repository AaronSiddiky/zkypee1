import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from './database.types';

// Function to track a new referral
export async function trackReferral(referrerId: string, referredId: string) {
  const supabase = createClientComponentClient<Database>();
  
  try {
    // Insert the referral record
    const { error: referralError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referred_id: referredId,
      });

    if (referralError) {
      console.error('Error tracking referral:', referralError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in trackReferral:', error);
    return false;
  }
}

// Function to mark a referral as converted and pay the reward
export async function convertReferral(referredId: string) {
  const supabase = createClientComponentClient<Database>();
  
  try {
    // Get the referral record
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_id', referredId)
      .single();

    if (referralError || !referral) {
      console.error('Error getting referral:', referralError);
      return false;
    }

    // If already converted, skip
    if (referral.converted_at || referral.reward_paid) {
      return true;
    }

    // Start a transaction to update both the referral and the referrer's earnings
    const { error: updateError } = await supabase
      .from('referrals')
      .update({
        converted_at: new Date().toISOString(),
        reward_paid: true,
      })
      .eq('id', referral.id);

    if (updateError) {
      console.error('Error updating referral:', updateError);
      return false;
    }

    // Update the referrer's total earnings
    const { error: earningsError } = await supabase
      .from('users')
      .update({
        total_referral_earnings: supabase.rpc('increment', { amount: 1.00 })
      })
      .eq('id', referral.referrer_id);

    if (earningsError) {
      console.error('Error updating earnings:', earningsError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in convertReferral:', error);
    return false;
  }
}

// Function to get referral code from URL
export function getReferralCodeFromURL() {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('ref');
}

// Function to validate a referral code
export async function validateReferralCode(code: string) {
  const supabase = createClientComponentClient<Database>();
  
  try {
    console.log('Validating referral code:', code);
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, referral_code')
      .eq('referral_code', code.toUpperCase())
      .single();

    console.log('Database response:', { user, error });

    if (error || !user) {
      console.log('Validation failed:', error || 'No user found');
      return null;
    }

    console.log('Validation successful, referrer ID:', user.id);
    return user.id;
  } catch (error) {
    console.error('Error validating referral code:', error);
    return null;
  }
} 