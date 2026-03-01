"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  getProducts,
  getProductCategories,
  type MedusaProduct,
  type MedusaCategory,
} from "@/lib/medusa"
import { ProductGrid } from "@/components/product/ProductGrid"

type SortOption = "price-asc" | "price-desc" | "name-asc" | "newest"

type PriceRange = "all" | "0-30" | "30-50" | "50-100" | "100+"

function getLowestPrice(product: MedusaProduct): number | null {
  let lowest: number | null = null

  for (const variant of product.variants) {
    if (variant.calculated_price) {
      const amount = variant.calculated_price.calculated_amount
      if (lowest === null || amount < lowest) {
        lowest = amount
      }
      continue
    }

    for (const price of variant.prices) {
      if (lowest === null || price.amount < lowest) {
        lowest = price.amount
      }
    }
  }

  return lowest
}

export default function LojaPage() {
  const [products, setProducts] = useState<MedusaProduct[]>([])
  const [categories, setCategories] = useState<MedusaCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set()
  )
  const [priceRange, setPriceRange] = useState<PriceRange>("all")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsData, categoriesData] = await Promise.all([
          getProducts({ limit: "100" }),
          getProductCategories(),
        ])
        setProducts(productsData.products)
        setCategories(categoriesData.product_categories)
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const toggleCategory = useCallback((categoryId: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }, [])

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products]

    // Filter by category
    if (selectedCategories.size > 0) {
      result = result.filter((product) =>
        product.categories?.some((cat) => selectedCategories.has(cat.id))
      )
    }

    // Filter by price range
    if (priceRange !== "all") {
      result = result.filter((product) => {
        const price = getLowestPrice(product)
        if (price === null) return false

        switch (priceRange) {
          case "0-30":
            return price <= 30
          case "30-50":
            return price > 30 && price <= 50
          case "50-100":
            return price > 50 && price <= 100
          case "100+":
            return price > 100
          default:
            return true
        }
      })
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => {
          const priceA = getLowestPrice(a) ?? Infinity
          const priceB = getLowestPrice(b) ?? Infinity
          return priceA - priceB
        })
        break
      case "price-desc":
        result.sort((a, b) => {
          const priceA = getLowestPrice(a) ?? -Infinity
          const priceB = getLowestPrice(b) ?? -Infinity
          return priceB - priceA
        })
        break
      case "name-asc":
        result.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"))
        break
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )
        break
    }

    return result
  }, [products, selectedCategories, priceRange, sortBy])

  const priceRangeOptions: { value: PriceRange; label: string }[] = [
    { value: "all", label: "Todos os precos" },
    { value: "0-30", label: "Ate R$30" },
    { value: "30-50", label: "R$30 - R$50" },
    { value: "50-100", label: "R$50 - R$100" },
    { value: "100+", label: "Acima de R$100" },
  ]

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Mais recentes" },
    { value: "price-asc", label: "Menor preco" },
    { value: "price-desc", label: "Maior preco" },
    { value: "name-asc", label: "Nome A-Z" },
  ]

  const sidebarContent = (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="mb-4 font-serif text-lg">Categorias</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <label
              key={category.id}
              className="flex cursor-pointer items-center gap-2 text-sm text-[#1a1a1a]/80 transition-colors hover:text-[#1a1a1a]"
            >
              <input
                type="checkbox"
                checked={selectedCategories.has(category.id)}
                onChange={() => toggleCategory(category.id)}
                className="size-4 accent-[#1a1a1a]"
              />
              {category.name}
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="mb-4 font-serif text-lg">Faixa de Preco</h3>
        <div className="space-y-2">
          {priceRangeOptions.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 text-sm text-[#1a1a1a]/80 transition-colors hover:text-[#1a1a1a]"
            >
              <input
                type="radio"
                name="price-range"
                checked={priceRange === option.value}
                onChange={() => setPriceRange(option.value)}
                className="size-4 accent-[#1a1a1a]"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <h3 className="mb-4 font-serif text-lg">Ordenar por</h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="w-full border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[#1a1a1a]"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header Bar */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl">Loja</h1>
          {!isLoading && (
            <p className="mt-1 text-sm text-[#1a1a1a]/60">
              {filteredAndSortedProducts.length}{" "}
              {filteredAndSortedProducts.length === 1
                ? "produto"
                : "produtos"}
            </p>
          )}
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="border border-[#e5e5e5] px-4 py-2 text-sm transition-colors hover:border-[#1a1a1a] lg:hidden"
        >
          {isSidebarOpen ? "Fechar Filtros" : "Filtros"}
        </button>
      </div>

      <div className="flex gap-8">
        {/* Sidebar - Desktop */}
        <aside className="hidden w-64 shrink-0 lg:block">
          {sidebarContent}
        </aside>

        {/* Sidebar - Mobile (overlay) */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/20"
              onClick={() => setIsSidebarOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-white p-6 pt-20 shadow-lg">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="absolute right-4 top-20 text-sm text-[#1a1a1a]/60 hover:text-[#1a1a1a]"
              >
                Fechar
              </button>
              {sidebarContent}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm text-[#1a1a1a]/50">
                Carregando produtos...
              </p>
            </div>
          ) : (
            <ProductGrid products={filteredAndSortedProducts} />
          )}
        </div>
      </div>
    </div>
  )
}
