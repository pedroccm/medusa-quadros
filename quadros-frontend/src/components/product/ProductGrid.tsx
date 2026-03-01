import { ProductCard } from "@/components/product/ProductCard"
import type { MedusaProduct } from "@/lib/medusa"

interface ProductGridProps {
  products: MedusaProduct[]
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#1a1a1a]/50">
          Nenhum produto encontrado.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
