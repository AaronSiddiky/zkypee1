"use client";

import React from 'react';
import Button from '../components/Button';

export default function AboutPage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">About Us</h1>
      <p className="mb-4">
        We are a company dedicated to creating simple and effective websites using React and TypeScript.
      </p>
      <div className="mt-6">
        <Button text="Learn More" variant="primary" />
      </div>
    </main>
  );
} 