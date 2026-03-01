export interface ProductVariant {
  id: string
  title: string
  prices: {
    amount: number
    currency_code: string
  }[]
}

export interface Product {
  id: string
  title: string
  handle: string
  description?: string
  thumbnail: string | null
  images?: {
    id: string
    url: string
  }[]
  variants: ProductVariant[]
  collection?: {
    id: string
    title: string
    handle: string
  }
}

export interface CartItem {
  id: string
  variantId: string
  productId: string
  title: string
  variantTitle: string
  thumbnail: string | null
  quantity: number
  unitPrice: number
}
