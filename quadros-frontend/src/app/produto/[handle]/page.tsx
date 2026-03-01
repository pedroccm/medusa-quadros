import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProduct, getProducts, type MedusaProduct } from "@/lib/medusa"
import { ProductDetail } from "./ProductDetail"

export const dynamic = "force-dynamic"

interface ProductPageProps {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { handle } = await params
  const product = await getProduct(handle)

  if (!product) {
    return { title: "Produto nao encontrado" }
  }

  return {
    title: `${product.title} - Quadros Store`,
    description:
      product.description ??
      `${product.title} - Quadro decorativo com qualidade premium.`,
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { handle } = await params
  const product = await getProduct(handle)

  if (!product) {
    notFound()
  }

  // Fetch related products from the same category
  let relatedProducts: MedusaProduct[] = []
  const categoryId = product.categories?.[0]?.id
  if (categoryId) {
    try {
      const { products } = await getProducts({
        "category_id[]": categoryId,
        limit: "5",
      })
      // Exclude the current product from related
      relatedProducts = products.filter((p) => p.id !== product.id)
    } catch {
      // Silently fail - related products are not critical
      relatedProducts = []
    }
  }

  // If no category-based related products, fetch latest products as fallback
  if (relatedProducts.length === 0) {
    try {
      const { products } = await getProducts({ limit: "5" })
      relatedProducts = products.filter((p) => p.id !== product.id)
    } catch {
      relatedProducts = []
    }
  }

  return <ProductDetail product={product} relatedProducts={relatedProducts} />
}
