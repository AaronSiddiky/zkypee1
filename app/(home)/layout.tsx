import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Zkypee | Connect with Anyone, Anywhere",
  description:
    "Make high-quality voice and video calls to anyone in the world with Zkypee.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
