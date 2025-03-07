import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zkypee Blog | Communication Tips & Best Skype Alternatives",
  description:
    "Learn about communication tools, tips, and the best Skype alternatives as Skype is shutting down. Discover why Zkypee is the perfect free Skype replacement.",
  keywords:
    "Skype alternative, Skype shutting down, free Skype replacement, communication tips, VoIP blog",
  openGraph: {
    title: "Zkypee Blog | Communication Tips & Best Skype Alternatives",
    description:
      "Learn about communication tools, tips, and the best Skype alternatives.",
    type: "website",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Removing the entire blue header section */}

      {children}
    </div>
  );
}
