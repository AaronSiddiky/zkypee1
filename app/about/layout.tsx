import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'About Us | Zkypee',
  description: 'Learn more about Zkypee and our mission to connect people worldwide.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 