import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Zkypee',
  description: 'Get in touch with the Zkypee team.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 