import Link from "next/link"
import { getProducts, getProductCategories } from "@/lib/medusa"
import { ProductGrid } from "@/components/product/ProductGrid"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  let products: any[] = []
  let categories: any[] = []

  try {
    const [productsData, categoriesData] = await Promise.all([
      getProducts({ limit: "12" }),
      getProductCategories(),
    ])
    products = productsData?.products || []
    categories = categoriesData?.product_categories || []
  } catch {
    // Medusa backend not available
  }

  const featuredProducts = products.slice(0, 8)
  const moreProducts = products.slice(8, 12)

  return (
    <div>
      {/* Hero Section */}
      <section className="flex h-[50vh] items-center justify-center bg-[#1a1a1a] px-4 text-white md:h-[70vh]">
        <div className="text-center">
          <h1 className="font-serif text-5xl leading-tight tracking-tight md:text-7xl">
            Quadros que transformam ambientes
          </h1>
          <p className="mx-auto mt-4 max-w-md text-lg text-gray-300">
            Arte em alta qualidade para sua casa e escritorio
          </p>
          <Link
            href="/loja"
            className="mt-8 inline-block bg-white px-8 py-3 text-sm font-medium tracking-wide text-black transition-opacity hover:opacity-90"
          >
            Explorar Colecao
          </Link>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20">
          <h2 className="mb-12 text-center font-serif text-3xl">
            Categorias
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categoria/${category.handle}`}
                className="group relative flex h-48 items-center justify-center overflow-hidden bg-[#1a1a1a] md:h-48"
              >
                <div className="absolute inset-0 bg-black/40 transition-opacity group-hover:bg-black/30" />
                <span className="relative font-serif text-xl text-white">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="mb-12 text-center font-serif text-3xl">
          Destaques
        </h2>
        <ProductGrid products={featuredProducts} />
      </section>

      {/* Banner */}
      <section className="bg-[#1a1a1a] py-16 text-center text-white">
        <p className="font-serif text-2xl">
          Frete gratis acima de R$199
        </p>
      </section>

      {/* More Products */}
      {moreProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20">
          <ProductGrid products={moreProducts} />
        </section>
      )}
    </div>
  )
}
