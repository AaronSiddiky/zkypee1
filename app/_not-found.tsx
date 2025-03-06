// This should be a server component
import Link from "next/link";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | Zkypee",
  description: "The page you are looking for does not exist.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-lg mb-8">
        The page you are looking for does not exist.
      </p>
      <Link href="/" className="text-blue-500 hover:underline">
        Return to Home
      </Link>
    </div>
  );
}
