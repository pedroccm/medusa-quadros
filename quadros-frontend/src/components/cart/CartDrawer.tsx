"use client"

import Link from "next/link"
import Image from "next/image"
import { Minus, Plus, X } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { formatPrice } from "@/lib/medusa"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import type { MedusaLineItem } from "@/lib/medusa"

function CartItemRow({ item }: { item: MedusaLineItem }) {
  const { updateItem, removeItem, isLoading } = useCart()

  return (
    <div className="flex gap-4 py-4">
      {/* Thumbnail */}
      <div className="relative size-20 shrink-0 overflow-hidden rounded-md border border-[#e5e5e5] bg-[#fafafa]">
        {item.thumbnail ? (
          <Image
            src={item.thumbnail}
            alt={item.title}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-[#1a1a1a]/30">
            Sem imagem
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-serif text-sm text-[#1a1a1a]">{item.title}</p>
            {item.variant?.title && item.variant.title !== "Default" && (
              <p className="mt-0.5 text-xs text-[#1a1a1a]/50">
                {item.variant.title}
              </p>
            )}
          </div>
          <button
            onClick={() => removeItem(item.id)}
            disabled={isLoading}
            className="shrink-0 text-[#1a1a1a]/40 transition-colors hover:text-[#1a1a1a] disabled:opacity-30"
            aria-label={`Remove ${item.title}`}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          {/* Quantity controls */}
          <div className="flex items-center border border-[#e5e5e5]">
            <button
              onClick={() => updateItem(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1 || isLoading}
              className="flex size-7 items-center justify-center text-[#1a1a1a]/60 transition-colors hover:text-[#1a1a1a] disabled:opacity-30"
              aria-label="Decrease quantity"
            >
              <Minus className="size-3" />
            </button>
            <span className="flex w-8 items-center justify-center text-xs text-[#1a1a1a]">
              {item.quantity}
            </span>
            <button
              onClick={() => updateItem(item.id, item.quantity + 1)}
              disabled={isLoading}
              className="flex size-7 items-center justify-center text-[#1a1a1a]/60 transition-colors hover:text-[#1a1a1a] disabled:opacity-30"
              aria-label="Increase quantity"
            >
              <Plus className="size-3" />
            </button>
          </div>

          {/* Price */}
          <span className="text-sm text-[#1a1a1a]">
            {formatPrice(item.total ?? item.unit_price * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  )
}

export function CartDrawer() {
  const { cart, isCartOpen, toggleCart } = useCart()
  const items = cart?.items ?? []
  const isEmpty = items.length === 0

  return (
    <Sheet open={isCartOpen} onOpenChange={toggleCart}>
      <SheetContent side="right" className="flex w-full flex-col bg-[#fafafa] sm:max-w-md">
        <SheetHeader className="border-b border-[#e5e5e5] pb-4">
          <SheetTitle className="text-sm font-medium uppercase tracking-wider text-[#1a1a1a]">
            Seu Carrinho
          </SheetTitle>
        </SheetHeader>

        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
            <p className="text-sm text-[#1a1a1a]/50">
              Seu carrinho está vazio.
            </p>
            <Button
              variant="outline"
              asChild
              onClick={toggleCart}
              className="border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white"
            >
              <Link href="/loja">Explorar produtos</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-4">
              {items.map((item, index) => (
                <div key={item.id}>
                  <CartItemRow item={item} />
                  {index < items.length - 1 && (
                    <Separator className="bg-[#e5e5e5]" />
                  )}
                </div>
              ))}
            </div>

            {/* Footer with subtotal and checkout */}
            <SheetFooter className="border-t border-[#e5e5e5] pt-4">
              <div className="w-full space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#1a1a1a]/60">Subtotal</span>
                  <span className="text-base font-medium text-[#1a1a1a]">
                    {formatPrice(cart?.subtotal ?? 0)}
                  </span>
                </div>
                <p className="text-xs text-[#1a1a1a]/40">
                  Frete calculado no checkout.
                </p>
                <Button
                  asChild
                  className="w-full bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90"
                  onClick={toggleCart}
                >
                  <Link href="/checkout">Finalizar Compra</Link>
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
