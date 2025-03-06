/**
 * Utility to register the token filtering service worker
 */

export function registerTokenFilterServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/token-filter-sw.js")
        .then((registration) => {
          console.log(
            "Token filter service worker registered:",
            registration.scope
          );
        })
        .catch((error) => {
          console.error("Service worker registration failed:", error);
        });
    });
  }
}

/**
 * Checks if the service worker is active
 */
export async function isTokenFilterActive(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration(
      "/token-filter-sw.js"
    );
    return !!registration && !!registration.active;
  } catch (error) {
    console.error("Error checking service worker status:", error);
    return false;
  }
}

/**
 * Unregisters the token filter service worker
 */
export async function unregisterTokenFilter(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration(
      "/token-filter-sw.js"
    );
    if (registration) {
      await registration.unregister();
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error unregistering service worker:", error);
    return false;
  }
}
