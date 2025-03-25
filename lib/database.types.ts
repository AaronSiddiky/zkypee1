export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          created_at: string;
          email: string;
          credit_balance: number;
          name: string | null;
          avatar_url: string | null;
          referral_code: string;
          total_referral_earnings: number;
        };
        Insert: {
          id: string;
          created_at?: string;
          email: string;
          credit_balance?: number;
          name?: string | null;
          avatar_url?: string | null;
          referral_code?: string;
          total_referral_earnings?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          email?: string;
          credit_balance?: number;
          name?: string | null;
          avatar_url?: string | null;
          referral_code?: string;
          total_referral_earnings?: number;
        };
      };
      transactions: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          amount: number;
          credits_added: number;
          payment_intent_id: string;
          status: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          amount: number;
          credits_added: number;
          payment_intent_id: string;
          status: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          amount?: number;
          credits_added?: number;
          payment_intent_id?: string;
          status?: string;
        };
      };
      call_logs: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          duration_minutes: number;
          credits_used: number;
          call_sid: string;
          status: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          duration_minutes: number;
          credits_used: number;
          call_sid: string;
          status: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          duration_minutes?: number;
          credits_used?: number;
          call_sid?: string;
          status?: string;
        };
      };
      credit_transfers: {
        Row: {
          id: string;
          created_at: string;
          skype_username: string;
          credit_amount: number;
          email: string;
          status: string;
          user_id: string | null;
          processed_at: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          skype_username: string;
          credit_amount: number;
          email: string;
          status?: string;
          user_id?: string | null;
          processed_at?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          skype_username?: string;
          credit_amount?: number;
          email?: string;
          status?: string;
          user_id?: string | null;
          processed_at?: string | null;
          notes?: string | null;
        };
      };
      referrals: {
        Row: {
          id: string;
          created_at: string;
          referrer_id: string;
          referred_id: string;
          converted_at: string | null;
          reward_paid: boolean;
          reward_amount: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          referrer_id: string;
          referred_id: string;
          converted_at?: string | null;
          reward_paid?: boolean;
          reward_amount?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          referrer_id?: string;
          referred_id?: string;
          converted_at?: string | null;
          reward_paid?: boolean;
          reward_amount?: number;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
