"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Analytics component for tracking page views and events
 * This component should be added to a layout file so it's available on all pages
 */
export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // This effect runs on route changes
    const url =
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : "");

    // Track page view
    // This is where you'd add your analytics implementation
    // Examples include Google Analytics, Plausible, Fathom, etc.
    console.log(`Page viewed: ${url}`);

    // Add your analytics tracking code here, e.g.:
    // if (typeof window.gtag === 'function') {
    //   window.gtag('config', 'G-XXXXXXXXXX', {
    //     page_path: url,
    //   });
    // }
  }, [pathname, searchParams]);

  return null; // This component doesn't render anything
}
