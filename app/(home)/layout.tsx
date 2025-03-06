import type { Metadata, Viewport } from "next";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useState, useEffect } from 'react';

export const metadata: Metadata = {
  title: "Zkypee | Connect with Anyone, Anywhere",
  description:
    "Make high-quality voice and video calls to anyone in the world with Zkypee.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// Component that displays the credit amount
export const UserCredits = () => {
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchUserCredits = async () => {
      setLoading(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Fetch the user's credit information from your users table
        // Adjust the table name and column name as needed for your schema
        const { data, error } = await supabase
          .from('users')
          .select('credit_balance')
          .eq('id', user.id)
          .single();
        
        if (data && !error) {
          setCredits(data.credit_balance || 0);
        } else {
          console.error('Error fetching credits:', error);
        }
      }
      
      setLoading(false);
    };

    fetchUserCredits();
  }, [supabase]);

  // Format the credits as currency
  const formattedCredits = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(credits);

  return (
    <div className="credit-display">
      {loading ? '$0.00' : formattedCredits}
    </div>
  );
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
