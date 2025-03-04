"use client";

import React from "react";
import { useParams } from "next/navigation";
import NumberList from "../../../components/NumberList";
import Link from "next/link";

export default function CountryNumbersPage() {
  const params = useParams();
  const countryCode = params.countryCode as string;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/buy-number" className="text-blue-500 hover:text-blue-700">
          ← Back to Countries
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6 text-blue-500">
        Available Phone Numbers
      </h1>

      <NumberList countryCode={countryCode} />
    </div>
  );
}
