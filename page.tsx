"use client";

import React from "react";
import Button from "./components/Button";

export default function HomePage() {
  const handleJoinWaitlist = () => {
    // Implementation of handleJoinWaitlist function
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Welcome to My Website</h1>
      <p className="mb-4">This is a simple React TypeScript website.</p>
      <div className="mt-6 flex justify-center">
        <Button onClick={handleJoinWaitlist} customWidth="w-48">
          Join Waitlist
        </Button>
      </div>
    </main>
  );
}
