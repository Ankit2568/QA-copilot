import type { MetadataRoute } from "next";

import { SITE } from "@/lib/site";
import { TOOL_LIST } from "@/lib/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: `${SITE.url}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...TOOL_LIST.map((t) => ({
      url: `${SITE.url}/tools/${t.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
