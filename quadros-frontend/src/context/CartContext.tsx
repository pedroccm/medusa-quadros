"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { ReactNode } from "react"
import {
  createCart,
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  type MedusaCart,
} from "@/lib/medusa"

const CART_ID_KEY = "quadros_cart_id"

interface CartContextValue {
  cart: MedusaCart | null
  cartCount: number
  /** @deprecated Use cartCount instead */
  totalItems: number
  isCartOpen: boolean
  isLoading: boolean
  addItem: (variantId: string, quantity?: number) => Promise<void>
  removeItem: (lineItemId: string) => Promise<void>
  updateItem: (lineItemId: string, quantity: number) => Promise<void>
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<MedusaCart | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const cartCount = useMemo(() => {
    if (!cart?.items) return 0
    return cart.items.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  const refreshCart = useCallback(async () => {
    const cartId = localStorage.getItem(CART_ID_KEY)
    if (!cartId) {
      setCart(null)
      return
    }

    try {
      const { cart: fetchedCart } = await getCart(cartId)
      setCart(fetchedCart)
    } catch {
      // Cart might have expired or be invalid
      localStorage.removeItem(CART_ID_KEY)
      setCart(null)
    }
  }, [])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const ensureCart = useCallback(async (): Promise<string> => {
    const existingCartId = localStorage.getItem(CART_ID_KEY)
    if (existingCartId && cart) {
      return existingCartId
    }

    const { cart: newCart } = await createCart()
    localStorage.setItem(CART_ID_KEY, newCart.id)
    setCart(newCart)
    return newCart.id
  }, [cart])

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      setIsLoading(true)
      try {
        const cartId = await ensureCart()
        const { cart: updatedCart } = await addToCart(cartId, variantId, quantity)
        setCart(updatedCart)
        setIsCartOpen(true)
      } finally {
        setIsLoading(false)
      }
    },
    [ensureCart]
  )

  const removeItem = useCallback(async (lineItemId: string) => {
    const cartId = localStorage.getItem(CART_ID_KEY)
    if (!cartId) return

    setIsLoading(true)
    try {
      const { cart: updatedCart } = await removeCartItem(cartId, lineItemId)
      setCart(updatedCart)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateItem = useCallback(
    async (lineItemId: string, quantity: number) => {
      const cartId = localStorage.getItem(CART_ID_KEY)
      if (!cartId) return

      setIsLoading(true)
      try {
        const { cart: updatedCart } = await updateCartItem(
          cartId,
          lineItemId,
          quantity
        )
        setCart(updatedCart)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const toggleCart = useCallback(() => {
    setIsCartOpen((prev) => !prev)
  }, [])

  const openCart = useCallback(() => {
    setIsCartOpen(true)
  }, [])

  const closeCart = useCallback(() => {
    setIsCartOpen(false)
  }, [])

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      cartCount,
      totalItems: cartCount,
      isCartOpen,
      isLoading,
      addItem,
      removeItem,
      updateItem,
      toggleCart,
      openCart,
      closeCart,
      refreshCart,
    }),
    [
      cart,
      cartCount,
      isCartOpen,
      isLoading,
      addItem,
      removeItem,
      updateItem,
      toggleCart,
      openCart,
      closeCart,
      refreshCart,
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
