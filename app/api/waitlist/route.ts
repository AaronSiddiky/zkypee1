import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://xjslipdzcbdjteqnawpt.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc2xpcGR6Y2JkanRlcW5hd3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MzcxMDMsImV4cCI6MjA1NjUxMzEwM30.yfgMsfGMzf1KE7XGWIunR5oKZBr3SKYBQv4anLcqCA8";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: Request) {
  try {
    const { name, email } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Insert data into Supabase
    const { error } = await supabase.from("waitlist").insert([
      {
        name,
        email,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error saving to waitlist:", error);
    return NextResponse.json(
      { error: "Failed to save to waitlist" },
      { status: 500 }
    );
  }
}
