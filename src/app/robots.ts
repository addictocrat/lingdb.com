import { MetadataRoute } from "next";
import { APP_URL } from "@/lib/utils/constants";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = APP_URL;

  return {
    rules: [
      {
        userAgent: "*",
        disallow: [
          "/api/",
          "/*/dashboard",
          "/*/profile",
          "/*/dictionary",
          "/*/payment",

          // Non-English library pages block
          "/fr/library/",
          "/de/library/",
          "/es/library/",
          "/tr/library/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
