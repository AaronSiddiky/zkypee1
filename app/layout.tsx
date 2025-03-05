import "./globals.css";
import { Inter } from "next/font/google";
import type { Metadata, Viewport } from "next";
import MaintenanceScreen from "./MaintenanceScreen";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | Zkypee",
    default: "Zkypee | Under Maintenance",
  },
  description:
    "Zkypee is currently under maintenance. We will be back within the day.",
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
        {/* Maintenance screen is the only thing shown */}
        <MaintenanceScreen />
      </body>
    </html>
  );
}
