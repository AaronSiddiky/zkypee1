import React from 'react';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'My Simple Website',
  description: 'A simple website built with React and TypeScript',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="bg-blue-600 text-white p-4">
          <nav className="flex justify-between items-center">
            <h1 className="text-xl font-bold">My Website</h1>
            <ul className="flex space-x-4">
              <li><a href="/" className="hover:underline">Home</a></li>
              <li><a href="/about" className="hover:underline">About</a></li>
              <li><a href="/contact" className="hover:underline">Contact</a></li>
            </ul>
          </nav>
        </header>
        {children}
        <footer className="bg-gray-200 p-4 text-center">
          <p>© {new Date().getFullYear()} My Website. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
} 