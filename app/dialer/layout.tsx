import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Dialer | Zkypee',
  description: 'Make calls with Zkypee\'s VoIP service.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function DialerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 