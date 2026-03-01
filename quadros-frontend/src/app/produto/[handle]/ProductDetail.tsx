"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useCart } from "@/context/CartContext"
import { PriceTag } from "@/components/ui/PriceTag"
import { ProductCard } from "@/components/product/ProductCard"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { MedusaProduct, MedusaVariant } from "@/lib/medusa"

interface ProductDetailProps {
  product: MedusaProduct
  relatedProducts: MedusaProduct[]
}

function getVariantPrice(variant: MedusaVariant): number | null {
  if (variant.calculated_price) {
    return variant.calculated_price.calculated_amount
  }
  if (variant.prices?.length > 0) {
    return variant.prices[0].amount
  }
  return null
}

export function ProductDetail({ product, relatedProducts }: ProductDetailProps) {
  const { addItem, openCart } = useCart()
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants[0]?.id ?? ""
  )
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) ??
    product.variants[0]

  const price = selectedVariant ? getVariantPrice(selectedVariant) : null

  const mainImage =
    product.images?.[0]?.url ?? product.thumbnail ?? null

  const categoryName = product.categories?.[0]?.name ?? null
  const categoryHandle = product.categories?.[0]?.handle ?? null

  async function handleAddToCart() {
    if (!selectedVariant) return
    setIsAdding(true)
    try {
      await addItem(selectedVariant.id, quantity)
      toast.success(`${product.title} adicionado ao carrinho`)
      openCart()
    } catch {
      toast.error("Erro ao adicionar ao carrinho. Tente novamente.")
    } finally {
      setIsAdding(false)
    }
  }

  function decrementQuantity() {
    setQuantity((q) => Math.max(1, q - 1))
  }

  function incrementQuantity() {
    setQuantity((q) => q + 1)
  }

  const hasMultipleVariants = product.variants.length > 1

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
        {categoryName && categoryHandle && (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/categoria/${categoryHandle}`}
              className="hover:text-[#1a1a1a] transition-colors"
            >
              {categoryName}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-[#1a1a1a]">{product.title}</span>
      </nav>

      {/* Product section - 2 columns */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-12">
        {/* Left column - Image (60%) */}
        <div className="lg:col-span-3">
          <div className="group relative aspect-[3/4] w-full overflow-hidden bg-[#e5e5e5]/30">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.title}
                fill
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-150"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
              />
            ) : (
              <div className="flex size-full items-center justify-center text-sm text-[#1a1a1a]/30">
                Sem imagem
              </div>
            )}
          </div>
        </div>

        {/* Right column - Details (40%) */}
        <div className="lg:col-span-2">
          <h1 className="font-serif text-3xl text-[#1a1a1a]">
            {product.title}
          </h1>

          {/* Price */}
          {price !== null && (
            <div className="mt-4">
              <PriceTag
                amount={price}
                className="text-2xl font-bold text-[#1a1a1a]"
              />
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="mt-4 text-gray-600 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Variant selector */}
          {hasMultipleVariants && (
            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-[#1a1a1a]">
                Tamanho
              </label>
              <Select
                value={selectedVariantId}
                onValueChange={(value) => {
                  setSelectedVariantId(value)
                }}
              >
                <SelectTrigger className="w-full border-[#e5e5e5]">
                  <SelectValue placeholder="Selecione um tamanho" />
                </SelectTrigger>
                <SelectContent>
                  {product.variants.map((variant) => {
                    const variantPrice = getVariantPrice(variant)
                    return (
                      <SelectItem key={variant.id} value={variant.id}>
                        {variant.title}
                        {variantPrice !== null && (
                          <span className="ml-2 text-[#1a1a1a]/60">
                            - <PriceTag amount={variantPrice} />
                          </span>
                        )}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quantity selector */}
          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-[#1a1a1a]">
              Quantidade
            </label>
            <div className="inline-flex items-center border border-[#e5e5e5]">
              <button
                onClick={decrementQuantity}
                disabled={quantity <= 1}
                className="flex size-10 items-center justify-center text-[#1a1a1a]/60 transition-colors hover:text-[#1a1a1a] disabled:opacity-30"
                aria-label="Diminuir quantidade"
              >
                <Minus className="size-4" />
              </button>
              <span className="flex w-12 items-center justify-center text-sm text-[#1a1a1a]">
                {quantity}
              </span>
              <button
                onClick={incrementQuantity}
                className="flex size-10 items-center justify-center text-[#1a1a1a]/60 transition-colors hover:text-[#1a1a1a]"
                aria-label="Aumentar quantidade"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          {/* Add to cart button */}
          <button
            onClick={handleAddToCart}
            disabled={isAdding || !selectedVariant}
            className="mt-8 flex w-full items-center justify-center bg-[#1a1a1a] py-4 text-lg text-white transition-colors hover:bg-[#1a1a1a]/90 disabled:opacity-60"
          >
            {isAdding ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" />
                Adicionando...
              </>
            ) : (
              "Adicionar ao Carrinho"
            )}
          </button>
        </div>
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 border-t border-[#e5e5e5] pt-12">
          <h2 className="mb-8 font-serif text-2xl text-[#1a1a1a]">
            Voce tambem pode gostar
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
