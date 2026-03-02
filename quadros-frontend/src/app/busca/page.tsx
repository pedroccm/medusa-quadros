"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Loader2 } from "lucide-react"
import { getProducts, type MedusaProduct } from "@/lib/medusa"
import { ProductGrid } from "@/components/product/ProductGrid"
import { Input } from "@/components/ui/input"

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [query, setQuery] = useState(initialQuery)
  const [products, setProducts] = useState<MedusaProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchResults = useCallback(async (term: string) => {
    if (!term.trim()) {
      setProducts([])
      setHasSearched(false)
      return
    }

    setLoading(true)
    try {
      const { products } = await getProducts({ q: term.trim() })
      setProducts(products)
      setHasSearched(true)
    } catch {
      setProducts([])
      setHasSearched(true)
    } finally {
      setLoading(false)
    }
  }, [])

  // Search on initial load if query param exists
  useEffect(() => {
    if (initialQuery) {
      fetchResults(initialQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleChange(value: string) {
    setQuery(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams()
      if (value.trim()) params.set("q", value.trim())
      router.replace(`/busca${value.trim() ? `?${params}` : ""}`, {
        scroll: false,
      })
      fetchResults(value)
    }, 300)
  }

  return (
    <>
      <div className="relative mt-6 max-w-lg">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#1a1a1a]/40" />
        <Input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Buscar produtos..."
          className="border-[#e5e5e5] pl-10"
          autoFocus
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-[#1a1a1a]/40" />
        )}
      </div>

      <div className="mt-8">
        {!hasSearched && !loading && (
          <p className="text-sm text-[#1a1a1a]/50">
            Digite para buscar produtos...
          </p>
        )}

        {hasSearched && products.length === 0 && !loading && (
          <p className="text-sm text-[#1a1a1a]/50">
            Nenhum resultado encontrado para &ldquo;{query}&rdquo;.
          </p>
        )}

        {hasSearched && products.length > 0 && (
          <>
            <p className="mb-6 text-sm text-[#1a1a1a]/60">
              {products.length} resultado{products.length !== 1 ? "s" : ""}{" "}
              encontrado{products.length !== 1 ? "s" : ""}
            </p>
            <ProductGrid products={products} />
          </>
        )}
      </div>
    </>
  )
}

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl text-[#1a1a1a]">Buscar</h1>
      <Suspense fallback={<div className="mt-6 text-sm text-[#1a1a1a]/50">Carregando...</div>}>
        <SearchContent />
      </Suspense>
    </div>
  )
}
