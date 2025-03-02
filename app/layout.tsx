import React from 'react';
import Link from 'next/link';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Zkypee - Better than Skype',
  description: 'Make calls with ease and transfer your Skype credits',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="relative z-10 px-8 py-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link href="/">
              <span className="text-blue-500 text-3xl font-bold">Z</span>
            </Link>
            
            <nav className="flex items-center space-x-8">
              <Link href="/features" className="text-gray-700 hover:text-blue-500">
                Features
              </Link>
              <Link href="/transfer" className="text-gray-700 hover:text-blue-500">
                Transfer Skype Credits
              </Link>
              <Link href="/signup" className="bg-blue-500 text-white px-6 py-2 rounded-full">
                Join Waitlist
              </Link>
            </nav>
          </div>
        </header>
        
        {children}
      </body>
    </html>
  );
}
