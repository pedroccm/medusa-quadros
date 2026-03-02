"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  const cartIdRef = useRef<string | null>(null)
  const creatingCartRef = useRef<Promise<string> | null>(null)

  const cartCount = useMemo(() => {
    if (!cart?.items) return 0
    return cart.items.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  // On mount: load existing cart or pre-create one
  useEffect(() => {
    async function init() {
      const savedId = localStorage.getItem(CART_ID_KEY)
      if (savedId) {
        cartIdRef.current = savedId
        try {
          const { cart: fetched } = await getCart(savedId)
          setCart(fetched)
          return
        } catch {
          localStorage.removeItem(CART_ID_KEY)
          cartIdRef.current = null
        }
      }
      // Pre-create a cart so addItem is instant later
      try {
        const { cart: newCart } = await createCart()
        localStorage.setItem(CART_ID_KEY, newCart.id)
        cartIdRef.current = newCart.id
        setCart(newCart)
      } catch {
        // Backend not available - will retry on addItem
      }
    }
    init()
  }, [])

  const ensureCart = useCallback(async (): Promise<string> => {
    if (cartIdRef.current) return cartIdRef.current

    // Deduplicate concurrent calls
    if (creatingCartRef.current) return creatingCartRef.current

    creatingCartRef.current = (async () => {
      const { cart: newCart } = await createCart()
      localStorage.setItem(CART_ID_KEY, newCart.id)
      cartIdRef.current = newCart.id
      setCart(newCart)
      creatingCartRef.current = null
      return newCart.id
    })()

    return creatingCartRef.current
  }, [])

  const refreshCart = useCallback(async () => {
    const cartId = cartIdRef.current || localStorage.getItem(CART_ID_KEY)
    if (!cartId) {
      setCart(null)
      return
    }
    try {
      const { cart: fetched } = await getCart(cartId)
      setCart(fetched)
    } catch {
      localStorage.removeItem(CART_ID_KEY)
      cartIdRef.current = null
      setCart(null)
    }
  }, [])

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      setIsLoading(true)
      try {
        const cartId = await ensureCart()
        const { cart: updated } = await addToCart(cartId, variantId, quantity)
        setCart(updated)
      } catch (err) {
        // If cart expired, clear and retry once
        localStorage.removeItem(CART_ID_KEY)
        cartIdRef.current = null
        try {
          const { cart: newCart } = await createCart()
          localStorage.setItem(CART_ID_KEY, newCart.id)
          cartIdRef.current = newCart.id
          const { cart: updated } = await addToCart(newCart.id, variantId, quantity)
          setCart(updated)
        } catch {
          throw err
        }
      } finally {
        setIsLoading(false)
      }
    },
    [ensureCart]
  )

  const removeItem = useCallback(async (lineItemId: string) => {
    const cartId = cartIdRef.current
    if (!cartId) return

    setIsLoading(true)
    try {
      await removeCartItem(cartId, lineItemId)
      const { cart: refreshed } = await getCart(cartId)
      setCart(refreshed)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateItem = useCallback(
    async (lineItemId: string, quantity: number) => {
      const cartId = cartIdRef.current
      if (!cartId) return

      setIsLoading(true)
      try {
        const { cart: updated } = await updateCartItem(cartId, lineItemId, quantity)
        setCart(updated)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), [])
  const openCart = useCallback(() => setIsCartOpen(true), [])
  const closeCart = useCallback(() => setIsCartOpen(false), [])

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
