import type { MetadataRoute } from "next";
import { siteUrl } from "@/content/company";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "Google-Extended", "ClaudeBot", "PerplexityBot"], allow: "/" },
      { userAgent: "*", disallow: ["/api/"] },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
