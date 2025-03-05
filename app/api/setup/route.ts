import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";
import fs from "fs";
import path from "path";

// Create a Supabase client with the anon key for simple operations
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function POST(request: NextRequest) {
  try {
    // Extract request body
    const body = await request.json();
    const { operation } = body;

    switch (operation) {
      case "check_tables":
        // Check if tables exist by querying the users table
        try {
          const { data, error } = await supabase
            .from("users")
            .select("id")
            .limit(1);

          if (!error) {
            return NextResponse.json({
              exists: true,
              message: "Tables already exist",
            });
          }
          return NextResponse.json({
            exists: false,
            message: "Tables do not exist",
          });
        } catch (error) {
          return NextResponse.json({
            exists: false,
            message: "Tables do not exist",
          });
        }

      case "get_schema":
        try {
          // Read the schema.sql file
          const schemaPath = path.join(process.cwd(), "supabase", "schema.sql");
          let schemaSql;

          try {
            schemaSql = fs.readFileSync(schemaPath, "utf8");
          } catch (fsError) {
            // If we can't read the file, provide the schema as a fallback
            schemaSql = `
            -- Create extension for UUID generation
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            
            -- Create a public.users table that mirrors auth.users but adds our custom fields
            CREATE TABLE IF NOT EXISTS public.users (
              id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              email TEXT,
              credit_balance DECIMAL(10, 2) DEFAULT 0,
              name TEXT,
              avatar_url TEXT
            );
            
            -- Create function to automatically create a public.users record when auth.users is created
            CREATE OR REPLACE FUNCTION public.handle_new_user() 
            RETURNS TRIGGER AS $$
            BEGIN
              INSERT INTO public.users (id, email)
              VALUES (NEW.id, NEW.email);
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
            
            -- Create trigger to call the function when auth.users gets a new record
            DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
            CREATE TRIGGER on_auth_user_created
              AFTER INSERT ON auth.users
              FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
            
            -- Insert existing auth users into public.users if they don't exist
            INSERT INTO public.users (id, email)
            SELECT id, email FROM auth.users
            WHERE id NOT IN (SELECT id FROM public.users);
            
            -- Create transactions table
            CREATE TABLE IF NOT EXISTS public.transactions (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
              amount DECIMAL(10, 2) NOT NULL,
              credits_added DECIMAL(10, 2) NOT NULL,
              payment_intent_id TEXT NOT NULL,
              status TEXT NOT NULL,
              
              -- Add a check constraint to ensure amount and credits_added are positive
              CONSTRAINT positive_amount CHECK (amount > 0),
              CONSTRAINT positive_credits CHECK (credits_added > 0)
            );
            
            -- Create call_logs table
            CREATE TABLE IF NOT EXISTS public.call_logs (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
              duration_minutes DECIMAL(10, 2) NOT NULL,
              credits_used DECIMAL(10, 2) NOT NULL,
              call_sid TEXT NOT NULL,
              status TEXT NOT NULL,
              
              -- Add a check constraint to ensure duration and credits_used are positive
              CONSTRAINT positive_duration CHECK (duration_minutes > 0),
              CONSTRAINT positive_credits_used CHECK (credits_used > 0)
            );
            
            -- Create indexes for better query performance
            CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON public.transactions(user_id);
            CREATE INDEX IF NOT EXISTS call_logs_user_id_idx ON public.call_logs(user_id);
            CREATE INDEX IF NOT EXISTS call_logs_call_sid_idx ON public.call_logs(call_sid);
            
            -- Set up Row Level Security (RLS) policies
            -- Enable RLS on tables
            ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
            ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
            ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
            
            -- First drop existing policies (to avoid errors if they already exist)
            DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
            DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
            DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
            DROP POLICY IF EXISTS "Users can view their own call logs" ON public.call_logs;
            
            -- Create policies for users table
            CREATE POLICY "Users can view their own profile"
              ON public.users
              FOR SELECT
              USING (auth.uid() = id);
            
            CREATE POLICY "Users can update their own profile"
              ON public.users
              FOR UPDATE
              USING (auth.uid() = id);
            
            -- Create policies for transactions table
            CREATE POLICY "Users can view their own transactions"
              ON public.transactions
              FOR SELECT
              USING (auth.uid() = user_id);
            
            -- Create policies for call_logs table
            CREATE POLICY "Users can view their own call logs"
              ON public.call_logs
              FOR SELECT
              USING (auth.uid() = user_id);
            
            -- Grant necessary permissions to authenticated users
            GRANT SELECT, UPDATE ON public.users TO authenticated;
            GRANT SELECT ON public.transactions TO authenticated;
            GRANT SELECT ON public.call_logs TO authenticated;`;
          }

          // Always make sure the schema has DROP POLICY IF EXISTS statements
          if (!schemaSql.includes("DROP POLICY IF EXISTS")) {
            // Add the DROP POLICY statements before CREATE POLICY statements
            schemaSql = schemaSql.replace(
              /-- Create policies for users table/,
              `-- First drop existing policies (to avoid errors if they already exist)
            DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
            DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
            DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
            DROP POLICY IF EXISTS "Users can view their own call logs" ON public.call_logs;
            
            -- Create policies for users table`
            );
          }

          return NextResponse.json({
            success: true,
            schema: schemaSql,
          });
        } catch (error) {
          console.error("Failed to get schema:", error);
          return NextResponse.json(
            {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
          );
        }

      case "insert_users":
        try {
          // Try to insert the current user if the users table exists
          const { data: session } = await supabase.auth.getSession();
          if (session?.session?.user) {
            const user = session.session.user;
            try {
              const { error: insertError } = await supabase
                .from("users")
                .upsert({
                  id: user.id,
                  email: user.email,
                  created_at: new Date().toISOString(),
                  credit_balance: 0,
                });

              if (insertError) {
                console.warn(`Warning inserting user ${user.id}:`, insertError);
                // If this is due to table not existing, that's fine
                if (
                  insertError.message.includes(
                    'relation "public.users" does not exist'
                  )
                ) {
                  return NextResponse.json({
                    success: false,
                    needsSetup: true,
                    error:
                      "Users table doesn't exist yet, run the setup script first",
                  });
                }

                return NextResponse.json({
                  success: false,
                  error: insertError.message,
                });
              }

              return NextResponse.json({ success: true });
            } catch (error) {
              return NextResponse.json({
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
              });
            }
          } else {
            return NextResponse.json({
              success: false,
              error: "No authenticated user",
            });
          }
        } catch (error) {
          console.error("Failed to insert user:", error);
          return NextResponse.json(
            {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          { error: "Invalid operation" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Setup API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
