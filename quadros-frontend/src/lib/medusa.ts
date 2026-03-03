// Server-side uses MEDUSA_BACKEND_URL (absolute), client-side uses empty (relative, proxied via Next.js rewrites)
const MEDUSA_BACKEND_URL =
  typeof window === "undefined"
    ? (process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000")
    : (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "")
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
  total: number | null
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
  const regionId = await getDefaultRegionId()
  const merged: Record<string, string> = {
    region_id: regionId,
    "fields": "*variants.calculated_price",
    ...params,
  }
  const queryString = "?" + new URLSearchParams(merged).toString()
  return medusaFetch(`/store/products${queryString}`)
}

export async function getProduct(
  handle: string
): Promise<MedusaProduct | null> {
  const regionId = await getDefaultRegionId()
  const data = await medusaFetch<{ products: MedusaProduct[] }>(
    `/store/products?handle=${handle}&region_id=${regionId}&fields=*variants.calculated_price`
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

let cachedRegionId: string | null = null

async function getDefaultRegionId(): Promise<string> {
  if (cachedRegionId) return cachedRegionId
  const { regions } = await getRegions()
  const brRegion = regions?.find((r) => r.currency_code === "brl")
  cachedRegionId = brRegion?.id || regions?.[0]?.id || ""
  return cachedRegionId
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

// --- Payments (Mercado Pago) ---

export interface CreatePaymentRequest {
  cart_id: string
  payment_method: "pix" | "credit_card" | "bolbradesco"
  payer: {
    email: string
    first_name: string
    last_name: string
    identification: {
      type: string
      number: string
    }
  }
  total: number
  description?: string
  token?: string
  installments?: number
  payment_method_id?: string
  issuer_id?: string
}

export interface PaymentResult {
  payment_id: number
  status: string
  status_detail: string
  qr_code?: string
  qr_code_base64?: string
  ticket_url?: string
  barcode?: string
  three_ds_url?: string
}

export interface PaymentStatus {
  payment_id: number
  status: string
  status_detail: string
}

export async function createPayment(
  data: CreatePaymentRequest
): Promise<PaymentResult> {
  return medusaFetch("/store/payments/create", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getPaymentStatus(
  paymentId: string
): Promise<PaymentStatus> {
  return medusaFetch(`/store/payments/${paymentId}/status`)
}

// --- Asaas Payment ---

export interface AsaasPaymentRequest {
  cart_id: string
  payment_method: "pix" | "credit_card"
  payer: {
    email: string
    first_name: string
    last_name: string
    identification: {
      type: string
      number: string
    }
    phone?: string
  }
  total: number
  phone?: string
  description?: string
  credit_card?: {
    holder_name: string
    number: string
    expiry_month: string
    expiry_year: string
    security_code: string
  }
  installments?: number
  address?: {
    postalCode: string
    addressNumber: string
  }
}

export interface AsaasPaymentResult extends PaymentResult {
  authorization_code?: string
  nsu?: string
}

export async function createAsaasPayment(
  data: AsaasPaymentRequest
): Promise<AsaasPaymentResult> {
  return medusaFetch("/store/payments/asaas/create", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getAsaasPaymentStatus(
  paymentId: string
): Promise<PaymentStatus> {
  return medusaFetch(`/store/payments/asaas/${paymentId}/status`)
}

// --- Shipping Calculation (Melhor Envio) ---

export interface ShippingCalculateItem {
  quantity: number
  variant_title: string
}

export interface ShippingCalculateOption {
  id: string
  name: string
  company: string
  price: number
  delivery_min: number
  delivery_max: number
}

export async function calculateShipping(
  to_cep: string,
  items: ShippingCalculateItem[]
): Promise<{ shipping_options: ShippingCalculateOption[] }> {
  return medusaFetch("/store/shipping/calculate", {
    method: "POST",
    body: JSON.stringify({ to_cep, items }),
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

// --- Customer Types ---

export interface MedusaCustomer {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  has_account: boolean
  addresses: MedusaAddress[]
  created_at: string
}

export interface MedusaAddress {
  id: string
  first_name: string | null
  last_name: string | null
  address_1: string | null
  address_2: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  country_code: string | null
  phone: string | null
}

export interface MedusaOrder {
  id: string
  display_id: number
  status: string
  email: string
  total: number
  subtotal: number
  shipping_total: number
  tax_total: number
  items: MedusaLineItem[]
  created_at: string
  currency_code: string
  fulfillment_status: string
  payment_status: string
  shipping_address: MedusaAddress | null
}

// --- Auth Helpers ---

async function medusaAuthFetch<T = Record<string, unknown>>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  return medusaFetch<T>(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  })
}

// --- Customer Auth ---

export async function registerCustomer(
  email: string,
  password: string
): Promise<{ token: string }> {
  return medusaFetch("/auth/customer/emailpass/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function loginCustomer(
  email: string,
  password: string
): Promise<{ token: string }> {
  return medusaFetch("/auth/customer/emailpass", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function createCustomerProfile(
  token: string,
  data: { email: string; first_name: string; last_name: string }
): Promise<{ customer: MedusaCustomer }> {
  return medusaAuthFetch("/store/customers", token, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getCustomerMe(
  token: string
): Promise<{ customer: MedusaCustomer }> {
  return medusaAuthFetch("/store/customers/me", token)
}

export async function updateCustomerMe(
  token: string,
  data: Partial<{ first_name: string; last_name: string; phone: string }>
): Promise<{ customer: MedusaCustomer }> {
  return medusaAuthFetch("/store/customers/me", token, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// --- Password Reset ---

export async function requestPasswordReset(
  email: string
): Promise<void> {
  await medusaFetch("/auth/customer/emailpass/reset-password", {
    method: "POST",
    body: JSON.stringify({ identifier: email }),
  })
}

export async function resetPassword(
  email: string,
  token: string,
  password: string
): Promise<void> {
  await medusaFetch("/auth/customer/emailpass/update", {
    method: "POST",
    body: JSON.stringify({ email, token, password }),
  })
}

// --- Customer Addresses ---

export async function getCustomerAddresses(
  token: string
): Promise<{ addresses: MedusaAddress[] }> {
  return medusaAuthFetch("/store/customers/me/addresses", token)
}

export async function addCustomerAddress(
  token: string,
  data: Partial<MedusaAddress>
): Promise<{ address: MedusaAddress }> {
  return medusaAuthFetch("/store/customers/me/addresses", token, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateCustomerAddress(
  token: string,
  addressId: string,
  data: Partial<MedusaAddress>
): Promise<{ address: MedusaAddress }> {
  return medusaAuthFetch(`/store/customers/me/addresses/${addressId}`, token, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function deleteCustomerAddress(
  token: string,
  addressId: string
): Promise<void> {
  await medusaAuthFetch(`/store/customers/me/addresses/${addressId}`, token, {
    method: "DELETE",
  })
}

// --- Customer Orders ---

export async function getCustomerOrders(
  token: string
): Promise<{ orders: MedusaOrder[]; count: number }> {
  return medusaAuthFetch("/store/orders", token)
}

export async function getCustomerOrder(
  token: string,
  orderId: string
): Promise<{ order: MedusaOrder }> {
  return medusaAuthFetch(`/store/orders/${orderId}`, token)
}

// --- Admin Auth & Email Settings ---

export interface EmailSettings {
  from_email: string
  from_name: string
  enabled: {
    order_placed: boolean
    order_shipped: boolean
    welcome: boolean
  }
}

export async function loginAdmin(
  email: string,
  password: string
): Promise<{ token: string }> {
  return medusaFetch("/auth/user/emailpass", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

async function adminFetch<T = Record<string, unknown>>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${MEDUSA_BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`Admin API error ${res.status}: ${errorBody}`)
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return {} as T
  }

  return res.json()
}

export async function getEmailSettings(
  adminToken: string
): Promise<{ email_settings: EmailSettings }> {
  return adminFetch("/admin/email-settings", adminToken)
}

export async function updateEmailSettings(
  adminToken: string,
  settings: EmailSettings
): Promise<{ email_settings: EmailSettings }> {
  return adminFetch("/admin/email-settings", adminToken, {
    method: "POST",
    body: JSON.stringify(settings),
  })
}

export async function sendTestEmail(
  adminToken: string,
  emailType: string,
  toEmail: string
): Promise<{ success: boolean; message: string }> {
  return adminFetch("/admin/email-settings/test", adminToken, {
    method: "POST",
    body: JSON.stringify({ email_type: emailType, to_email: toEmail }),
  })
}
