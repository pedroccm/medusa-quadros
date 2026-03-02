import type { MetadataRoute } from "next"
import { getProducts } from "@/lib/medusa"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://quadrosstore.com.br"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    "",
    "/loja",
    "/categorias",
    "/sobre",
    "/contato",
    "/faq",
    "/trocas",
    "/privacidade",
    "/termos",
    "/busca",
    "/login",
    "/cadastro",
  ]

  const entries: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/loja" ? 0.9 : 0.7,
  }))

  try {
    const { products } = await getProducts({ limit: "500" })
    for (const product of products) {
      entries.push({
        url: `${SITE_URL}/produto/${product.handle}`,
        lastModified: new Date(product.updated_at),
        changeFrequency: "weekly",
        priority: 0.8,
      })
    }
  } catch {
    // Products fetch failed - continue with static pages only
  }

  return entries
}
