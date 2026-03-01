"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { PriceTag } from "@/components/ui/PriceTag"
import type { MedusaProduct } from "@/lib/medusa"

interface ProductCardProps {
  product: MedusaProduct
}

/**
 * Get the lowest price across all variants of a product.
 * Checks calculated_price first (region-aware), then falls back to prices array.
 */
function getLowestPrice(product: MedusaProduct): number | null {
  let lowest: number | null = null

  for (const variant of product.variants) {
    // Prefer calculated_price if available (Medusa v2 pricing)
    if (variant.calculated_price) {
      const amount = variant.calculated_price.calculated_amount
      if (lowest === null || amount < lowest) {
        lowest = amount
      }
      continue
    }

    // Fallback to prices array
    if (variant.prices) {
      for (const price of variant.prices) {
        if (lowest === null || price.amount < lowest) {
          lowest = price.amount
        }
      }
    }
  }

  return lowest
}

export function ProductCard({ product }: ProductCardProps) {
  const price = getLowestPrice(product)

  return (
    <Link href={`/produto/${product.handle}`} className="group block">
      <Card className="overflow-hidden rounded-none border-[#e5e5e5] bg-[#fafafa] p-0 shadow-none transition-transform duration-200 group-hover:scale-[1.02]">
        <AspectRatio ratio={3 / 4}>
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-[#e5e5e5]/30 text-xs text-[#1a1a1a]/30">
              Sem imagem
            </div>
          )}
        </AspectRatio>

        <CardContent className="space-y-1 p-4">
          <h3 className="font-serif text-sm text-[#1a1a1a] line-clamp-2">
            {product.title}
          </h3>
          {price !== null && (
            <PriceTag
              amount={price}
              className="block text-sm text-[#1a1a1a]/60"
            />
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
