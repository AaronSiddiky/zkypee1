import { NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // Initialize Supabase client
    const supabase = createServerComponentClient({ cookies });

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get database schema information
    const { data: tableInfo, error: tableError } = await supabase
      .from("users")
      .select("*")
      .limit(1);

    if (tableError) {
      return NextResponse.json(
        {
          error: "Error accessing users table",
          details: tableError,
        },
        { status: 500 }
      );
    }

    // Get current user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (userError) {
      return NextResponse.json(
        {
          error: "Error accessing user data",
          details: userError,
        },
        { status: 500 }
      );
    }

    // Test update operation
    const testUpdate = {
      test_field: "Test value " + new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("users")
      .update(testUpdate)
      .eq("id", user.id);

    return NextResponse.json({
      authenticated: !!user,
      userId: user.id,
      userEmail: user.email,
      tableColumns: tableInfo && tableInfo[0] ? Object.keys(tableInfo[0]) : [],
      userDataExists: !!userData,
      userData: userData,
      hasPhoneNumbersColumn: userData
        ? "purchased_phone_numbers" in userData
        : false,
      phoneNumbersType:
        userData && userData.purchased_phone_numbers
          ? Array.isArray(userData.purchased_phone_numbers)
            ? "array"
            : typeof userData.purchased_phone_numbers
          : "undefined",
      updateTest: {
        success: !updateError,
        error: updateError,
      },
    });
  } catch (error) {
    console.error("Error checking user table:", error);
    return NextResponse.json(
      { error: "Server error", details: error },
      { status: 500 }
    );
  }
}
