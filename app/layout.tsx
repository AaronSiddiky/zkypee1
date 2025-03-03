import React from "react";
import "./globals.css";
import { Inter } from "next/font/google";
import ClientLayout from "./client-layout";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zkypee - Better than Skype",
  description: "Make calls with ease and transfer your Skype credits",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
