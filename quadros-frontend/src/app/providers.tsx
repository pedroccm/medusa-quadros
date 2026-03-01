"use client"

import type { ReactNode } from "react"
import { CartProvider } from "@/context/CartContext"
import { AuthProvider } from "@/context/AuthContext"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <AuthProvider>{children}</AuthProvider>
    </CartProvider>
  )
}
