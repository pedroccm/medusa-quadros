import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getProductCategories, getProducts, type MedusaProduct } from "@/lib/medusa"
import { ProductGrid } from "@/components/product/ProductGrid"

export const dynamic = "force-dynamic"

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const { product_categories } = await getProductCategories()
  const category = product_categories.find(
    (c) => c.handle === slug || c.id === slug
  )

  if (!category) {
    return { title: "Categoria nao encontrada" }
  }

  return {
    title: `${category.name} - Quadros Store`,
    description: `Quadros decorativos na categoria ${category.name}. Arte impressa com qualidade premium.`,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params

  // Get all categories and find the matching one
  const { product_categories } = await getProductCategories()
  const category = product_categories.find(
    (c) => c.handle === slug || c.id === slug
  )

  if (!category) {
    notFound()
  }

  // Fetch products filtered by category
  let products: MedusaProduct[] = []
  try {
    const result = await getProducts({
      "category_id[]": category.id,
      limit: "100",
    })
    products = result.products
  } catch {
    products = []
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-gray-500">
        <Link href="/" className="hover:text-[#1a1a1a] transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/loja" className="hover:text-[#1a1a1a] transition-colors">
          Loja
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[#1a1a1a]">{category.name}</span>
      </nav>

      {/* Category heading */}
      <h1 className="mb-8 font-serif text-4xl text-[#1a1a1a]">
        {category.name}
      </h1>

      {/* Product grid */}
      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-[#1a1a1a]/50">
            Nenhum produto encontrado nesta categoria.
          </p>
        </div>
      )}
    </div>
  )
}
