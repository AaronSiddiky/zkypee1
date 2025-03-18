"use client";

// Client-side accessible phone number configuration
// This makes it easy to modify the phone number without changing environment variables

// Default phone number to use for Twilio calls
export const DEFAULT_TWILIO_PHONE_NUMBER = "+13158722206";

// Get the active phone number (from localStorage if available)
export function getTwilioPhoneNumber(): string {
  if (typeof window !== "undefined") {
    const storedNumber = localStorage.getItem("selectedOutgoingNumber");
    return storedNumber || DEFAULT_TWILIO_PHONE_NUMBER;
  }
  return DEFAULT_TWILIO_PHONE_NUMBER;
}

// Set the active phone number
export function setTwilioPhoneNumber(phoneNumber: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("selectedOutgoingNumber", phoneNumber);
    console.log(`Selected outgoing number changed to: ${phoneNumber}`);
  }
}

// Reset to default number
export function resetTwilioPhoneNumber(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("selectedOutgoingNumber");
    console.log("Reset to default outgoing number");
  }
}
