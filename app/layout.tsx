import "./globals.css";
import { Inter } from "next/font/google";
import dynamic from "next/dynamic";
import type { Metadata, Viewport } from "next";

// Import ClientLayout with dynamic import to avoid webpack issues
const ClientLayout = dynamic(() => import("./client-layout"), {
  ssr: false,
});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | Best Skype Alternative - Zkypee",
    default: "Zkypee | Best Skype Alternative | Free Skype Replacement",
  },
  description:
    "Looking for the best Skype alternative since Skype is shutting down? Zkypee is the perfect free Skype replacement with high-quality voice and video calls to anyone in the world.",
  keywords:
    "Best Skype alternative, Skype shutting down alternative, Free Skype replacement, Skype replacement, video calls, voice calls",
};

// Separate viewport export
export const viewport: Viewport = {
  width: "device-width",
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
        <style
          dangerouslySetInnerHTML={{
            __html: `
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
        `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
