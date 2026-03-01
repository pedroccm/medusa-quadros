import Link from "next/link"
import { getProductCategories } from "@/lib/medusa"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Categorias - Quadros Store",
  description: "Explore nossas categorias de quadros decorativos.",
}

export default async function CategoriasPage() {
  let categories: { id: string; name: string; handle: string }[] = []

  try {
    const data = await getProductCategories()
    categories = data?.product_categories || []
  } catch {
    // Backend not available
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-12 text-center font-serif text-4xl text-[#1a1a1a]">
        Categorias
      </h1>

      {categories.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categoria/${category.handle || category.id}`}
              className="group flex h-48 items-center justify-center bg-[#1a1a1a] transition-opacity hover:opacity-90"
            >
              <span className="font-serif text-2xl text-white transition-transform duration-200 group-hover:scale-105">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-[#1a1a1a]/50">
          Nenhuma categoria encontrada.
        </p>
      )}
    </div>
  )
}
