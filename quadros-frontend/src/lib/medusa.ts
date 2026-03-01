const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_API_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
  "pk_f69ae9716e3053c6d517eb6245a23ad35c0b0c6970f5d358cf6286428e62a7ac"

export interface MedusaProduct {
  id: string
  title: string
  handle: string
  description: string | null
  thumbnail: string | null
  images: { id: string; url: string }[]
  variants: MedusaVariant[]
  options: { id: string; title: string; values: { id: string; value: string }[] }[]
  categories: { id: string; name: string; handle: string }[]
  created_at: string
  updated_at: string
}

export interface MedusaVariant {
  id: string
  title: string
  sku: string | null
  prices: MedusaPrice[]
  options: { id: string; value: string; option_id: string }[]
  inventory_quantity?: number
  manage_inventory?: boolean
  calculated_price?: {
    calculated_amount: number
    currency_code: string
    original_amount: number
  }
}

export interface MedusaPrice {
  id: string
  amount: number
  currency_code: string
}

export interface MedusaCart {
  id: string
  items: MedusaLineItem[]
  region: { id: string; currency_code: string }
  total: number
  subtotal: number
  discount_total: number
  shipping_total: number
  tax_total: number
  item_total: number
}

export interface MedusaLineItem {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  quantity: number
  unit_price: number
  total: number
  variant_id: string
  variant: MedusaVariant | null
  product: MedusaProduct | null
}

export interface MedusaRegion {
  id: string
  name: string
  currency_code: string
}

export interface MedusaCategory {
  id: string
  name: string
  handle: string
  parent_category: MedusaCategory | null
  category_children: MedusaCategory[]
}

export interface MedusaShippingOption {
  id: string
  name: string
  amount: number
  price_type: string
}

async function medusaFetch<T = Record<string, unknown>>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${MEDUSA_BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": PUBLISHABLE_API_KEY,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(
      `Medusa API error ${res.status}: ${res.statusText} - ${errorBody}`
    )
  }

  // DELETE responses may have no body
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return {} as T
  }

  return res.json()
}

// --- Products ---

export async function getProducts(
  params?: Record<string, string>
): Promise<{ products: MedusaProduct[]; count: number; offset: number; limit: number }> {
  const queryString = params
    ? "?" + new URLSearchParams(params).toString()
    : ""
  return medusaFetch(`/store/products${queryString}`)
}

export async function getProduct(
  handle: string
): Promise<MedusaProduct | null> {
  const data = await medusaFetch<{ products: MedusaProduct[] }>(
    `/store/products?handle=${handle}`
  )
  return data.products?.[0] || null
}

// --- Categories ---

export async function getProductCategories(): Promise<{
  product_categories: MedusaCategory[]
}> {
  return medusaFetch("/store/product-categories")
}

// --- Regions ---

export async function getRegions(): Promise<{ regions: MedusaRegion[] }> {
  return medusaFetch("/store/regions")
}

async function getDefaultRegionId(): Promise<string> {
  const { regions } = await getRegions()
  return regions?.[0]?.id || ""
}

// --- Cart ---

export async function createCart(): Promise<{ cart: MedusaCart }> {
  const regionId = await getDefaultRegionId()
  return medusaFetch("/store/carts", {
    method: "POST",
    body: JSON.stringify({ region_id: regionId }),
  })
}

export async function getCart(
  cartId: string
): Promise<{ cart: MedusaCart }> {
  return medusaFetch(`/store/carts/${cartId}`)
}

export async function addToCart(
  cartId: string,
  variantId: string,
  quantity: number
): Promise<{ cart: MedusaCart }> {
  return medusaFetch(`/store/carts/${cartId}/line-items`, {
    method: "POST",
    body: JSON.stringify({ variant_id: variantId, quantity }),
  })
}

export async function updateCartItem(
  cartId: string,
  lineItemId: string,
  quantity: number
): Promise<{ cart: MedusaCart }> {
  return medusaFetch(`/store/carts/${cartId}/line-items/${lineItemId}`, {
    method: "POST",
    body: JSON.stringify({ quantity }),
  })
}

export async function removeCartItem(
  cartId: string,
  lineItemId: string
): Promise<{ cart: MedusaCart }> {
  return medusaFetch(`/store/carts/${cartId}/line-items/${lineItemId}`, {
    method: "DELETE",
  })
}

// --- Shipping ---

export async function getShippingOptions(
  cartId: string
): Promise<{ shipping_options: MedusaShippingOption[] }> {
  return medusaFetch(`/store/shipping-options?cart_id=${cartId}`)
}

export async function addShippingMethod(
  cartId: string,
  optionId: string
): Promise<{ cart: MedusaCart }> {
  return medusaFetch(`/store/carts/${cartId}/shipping-methods`, {
    method: "POST",
    body: JSON.stringify({ option_id: optionId }),
  })
}

// --- Checkout ---

export async function completeCart(
  cartId: string
): Promise<{ type: string; data: Record<string, unknown> }> {
  return medusaFetch(`/store/carts/${cartId}/complete`, {
    method: "POST",
  })
}

// --- Formatting ---

export function formatPrice(
  amount: number,
  currencyCode = "BRL"
): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currencyCode,
  }).format(amount)
}
