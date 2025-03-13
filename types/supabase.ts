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
      call_logs: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          phone_number: string;
          call_sid: string;
          duration: number;
          cost: number;
          direction: string;
          status: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          phone_number: string;
          call_sid: string;
          duration: number;
          cost: number;
          direction: string;
          status: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          phone_number?: string;
          call_sid?: string;
          duration?: number;
          cost?: number;
          direction?: string;
          status?: string;
        };
      };
      credit_transactions: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          amount: number;
          description: string;
          transaction_type: string;
          reference_id?: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          amount: number;
          description: string;
          transaction_type: string;
          reference_id?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          amount?: number;
          description?: string;
          transaction_type?: string;
          reference_id?: string;
        };
      };
      rates: {
        Row: {
          id: string;
          created_at: string;
          country_code: string;
          country_name: string;
          rate_per_minute: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          country_code: string;
          country_name: string;
          rate_per_minute: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          country_code?: string;
          country_name?: string;
          rate_per_minute?: number;
          is_active?: boolean;
        };
      };
      trial_calls: {
        Row: {
          device_fingerprint: string;
          created_at: string;
          last_call_at: string | null;
          count: number;
          total_duration: number;
          last_call_sid: string | null;
          last_phone_number: string | null;
          user_id: string | null;
          converted_to_signup: boolean;
        };
        Insert: {
          device_fingerprint: string;
          created_at?: string;
          last_call_at?: string | null;
          count?: number;
          total_duration?: number;
          last_call_sid?: string | null;
          last_phone_number?: string | null;
          user_id?: string | null;
          converted_to_signup?: boolean;
        };
        Update: {
          device_fingerprint?: string;
          created_at?: string;
          last_call_at?: string | null;
          count?: number;
          total_duration?: number;
          last_call_sid?: string | null;
          last_phone_number?: string | null;
          user_id?: string | null;
          converted_to_signup?: boolean;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          credit_balance: number;
          preferences: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          credit_balance?: number;
          preferences?: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          credit_balance?: number;
          preferences?: Json;
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
