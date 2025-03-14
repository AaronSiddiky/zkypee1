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
        {/* Google tag (gtag.js) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-16917828312"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-16917828312');
            `,
          }}
        />

        {/* Basic favicon with explicit sizes */}
        <link rel="icon" href="/favicon.ico" sizes="48x48" />

        {/* PNG favicons */}
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />

        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Web Manifest */}
        <link rel="manifest" href="/site.webmanifest" />

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
