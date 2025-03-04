import "./globals.css";
import { Inter } from "next/font/google";
import ClientLayout from "./client-layout";
import type { Metadata, Viewport } from 'next';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: '%s | Zkypee',
    default: 'Zkypee | Connect with Anyone, Anywhere',
  },
  description: 'Make high-quality voice and video calls to anyone in the world with Zkypee.',
};

// Default viewport configuration for all pages
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          /* Target all buttons in the app */
          button {
            max-width: 160px !important;
          }
          
          /* Target specific button text */
          button:contains("Call Now"), 
          button:contains("Join Waitlist") {
            width: 160px !important;
            max-width: 160px !important;
          }
        `}} />
      </head>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
