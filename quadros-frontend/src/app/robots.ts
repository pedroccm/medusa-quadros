import type { MetadataRoute } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://quadrosstore.com.br"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/conta/", "/checkout", "/carrinho"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
