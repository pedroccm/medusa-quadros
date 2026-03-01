"use client"

import Link from "next/link"
import Image from "next/image"
import { Minus, Plus, X, ShoppingBag, ArrowLeft } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { formatPrice } from "@/lib/medusa"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { MedusaLineItem } from "@/lib/medusa"

function CartItemRow({ item }: { item: MedusaLineItem }) {
  const { updateItem, removeItem, isLoading } = useCart()

  const handleQuantityChange = (newQty: number) => {
    if (newQty < 1) return
    updateItem(item.id, newQty)
  }

  return (
    <div className="flex gap-4 py-6">
      {/* Product image */}
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

      {/* Item details */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-serif text-sm text-[#1a1a1a] truncate">
              {item.title}
            </p>
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
            aria-label={`Remover ${item.title}`}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2">
          {/* Quantity controls */}
          <div className="flex items-center border border-[#e5e5e5] rounded">
            <button
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={item.quantity <= 1 || isLoading}
              className="flex size-8 items-center justify-center text-[#1a1a1a]/60 transition-colors hover:text-[#1a1a1a] disabled:opacity-30"
              aria-label="Diminuir quantidade"
            >
              <Minus className="size-3" />
            </button>
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10)
                if (!isNaN(val) && val >= 1) {
                  handleQuantityChange(val)
                }
              }}
              disabled={isLoading}
              className="w-10 text-center text-sm text-[#1a1a1a] border-x border-[#e5e5e5] bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={isLoading}
              className="flex size-8 items-center justify-center text-[#1a1a1a]/60 transition-colors hover:text-[#1a1a1a] disabled:opacity-30"
              aria-label="Aumentar quantidade"
            >
              <Plus className="size-3" />
            </button>
          </div>

          {/* Prices */}
          <div className="text-right">
            <p className="text-sm font-medium text-[#1a1a1a]">
              {formatPrice(item.total)}
            </p>
            {item.quantity > 1 && (
              <p className="text-xs text-[#1a1a1a]/50">
                {formatPrice(item.unit_price)} cada
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CarrinhoPage() {
  const { cart, isLoading } = useCart()
  const items = cart?.items ?? []
  const isEmpty = items.length === 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl text-[#1a1a1a]">Carrinho</h1>

      {isEmpty ? (
        <div className="mt-16 flex flex-col items-center justify-center gap-6">
          <ShoppingBag className="size-16 text-[#1a1a1a]/20" />
          <p className="text-lg text-[#1a1a1a]/50">
            Seu carrinho está vazio
          </p>
          <Button
            asChild
            className="bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90"
          >
            <Link href="/loja">Explorar produtos</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-3">
          {/* Cart items - left column (2/3) */}
          <div className="lg:col-span-2">
            <div className="divide-y divide-[#e5e5e5]">
              {items.map((item) => (
                <CartItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* Order summary - right column (1/3) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-lg border border-[#e5e5e5] bg-white p-6">
              <h2 className="font-serif text-lg text-[#1a1a1a]">
                Resumo do Pedido
              </h2>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#1a1a1a]/60">Subtotal</span>
                  <span className="text-[#1a1a1a]">
                    {formatPrice(cart?.subtotal ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#1a1a1a]/60">Frete</span>
                  <span className="text-[#1a1a1a]/50 text-xs">
                    Calculado no checkout
                  </span>
                </div>
              </div>

              <Separator className="my-4 bg-[#e5e5e5]" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#1a1a1a]">
                  Total
                </span>
                <span className="text-lg font-medium text-[#1a1a1a]">
                  {formatPrice(cart?.subtotal ?? 0)}
                </span>
              </div>

              <Button
                asChild
                className="mt-6 w-full bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90"
                disabled={isLoading}
              >
                <Link href="/checkout">Finalizar Compra</Link>
              </Button>

              <Link
                href="/loja"
                className="mt-4 flex items-center justify-center gap-2 text-sm text-[#1a1a1a]/60 transition-colors hover:text-[#1a1a1a]"
              >
                <ArrowLeft className="size-4" />
                Continuar Comprando
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
