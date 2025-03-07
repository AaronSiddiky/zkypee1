import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/", "/setup/", "/dial/", "/dialer/"],
    },
    sitemap: "https://zkypee.com/sitemap.xml",
  };
}
