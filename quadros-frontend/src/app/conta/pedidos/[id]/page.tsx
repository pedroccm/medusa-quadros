"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { getCustomerOrder, formatPrice, type MedusaOrder } from "@/lib/medusa"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const AUTH_TOKEN_KEY = "quadros_auth_token"

function getStatusBadge(label: string, status: string) {
  const colorMap: Record<string, string> = {
    completed: "bg-green-100 text-green-800 hover:bg-green-100",
    paid: "bg-green-100 text-green-800 hover:bg-green-100",
    shipped: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    fulfilled: "bg-green-100 text-green-800 hover:bg-green-100",
    partially_fulfilled: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    canceled: "bg-red-100 text-red-800 hover:bg-red-100",
    refunded: "bg-red-100 text-red-800 hover:bg-red-100",
    not_paid: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    not_fulfilled: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    requires_action: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  }

  const color = colorMap[status] || "bg-gray-100 text-gray-800 hover:bg-gray-100"
  const displayStatus = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs uppercase tracking-wider text-[#1a1a1a]/40">
        {label}
      </span>
      <Badge className={color}>{displayStatus}</Badge>
    </div>
  )
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString))
}

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<MedusaOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchOrder() {
      const token = localStorage.getItem(AUTH_TOKEN_KEY)
      if (!token || !orderId) {
        setLoading(false)
        return
      }

      try {
        const { order: fetched } = await getCustomerOrder(token, orderId)
        setOrder(fetched)
      } catch {
        setError("Erro ao carregar detalhes do pedido.")
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [orderId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-[#1a1a1a]/40" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div>
        <Link
          href="/conta/pedidos"
          className="inline-flex items-center gap-2 text-sm text-[#1a1a1a]/60 transition-colors hover:text-[#1a1a1a]"
        >
          <ArrowLeft className="size-4" />
          Voltar aos pedidos
        </Link>
        <p className="mt-6 text-sm text-red-600">
          {error || "Pedido nao encontrado."}
        </p>
      </div>
    )
  }

  const currencyCode = order.currency_code?.toUpperCase() || "BRL"

  return (
    <div>
      <Link
        href="/conta/pedidos"
        className="inline-flex items-center gap-2 text-sm text-[#1a1a1a]/60 transition-colors hover:text-[#1a1a1a]"
      >
        <ArrowLeft className="size-4" />
        Voltar aos pedidos
      </Link>

      <h2 className="mt-4 font-serif text-xl text-[#1a1a1a]">
        Pedido #{order.display_id}
      </h2>

      {/* Order info */}
      <div className="mt-6 rounded-lg border border-[#e5e5e5] bg-white p-6">
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#1a1a1a]/40">
              Data
            </p>
            <p className="mt-1 text-sm text-[#1a1a1a]">
              {formatDate(order.created_at)}
            </p>
          </div>
          {getStatusBadge("Status", order.status)}
          {getStatusBadge("Pagamento", order.payment_status)}
          {getStatusBadge("Envio", order.fulfillment_status)}
        </div>
      </div>

      {/* Items */}
      <div className="mt-6 rounded-lg border border-[#e5e5e5] bg-white p-6">
        <h3 className="text-sm font-medium text-[#1a1a1a]">Itens</h3>

        <div className="mt-4 space-y-4">
          {order.items?.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="relative size-16 shrink-0 overflow-hidden rounded border border-[#e5e5e5] bg-[#fafafa]">
                {item.thumbnail ? (
                  <Image
                    src={item.thumbnail}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-[10px] text-[#1a1a1a]/30">
                    Sem img
                  </div>
                )}
              </div>
              <div className="flex flex-1 items-center justify-between min-w-0">
                <div className="min-w-0">
                  <p className="truncate text-sm text-[#1a1a1a]">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs text-[#1a1a1a]/50">
                    Qtd: {item.quantity} x{" "}
                    {formatPrice(item.unit_price, currencyCode)}
                  </p>
                </div>
                <p className="shrink-0 pl-4 text-sm text-[#1a1a1a]">
                  {formatPrice(item.total, currencyCode)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-4 bg-[#e5e5e5]" />

        {/* Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#1a1a1a]/60">Subtotal</span>
            <span className="text-[#1a1a1a]">
              {formatPrice(order.subtotal, currencyCode)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#1a1a1a]/60">Frete</span>
            <span className="text-[#1a1a1a]">
              {order.shipping_total === 0
                ? "Gratis"
                : formatPrice(order.shipping_total, currencyCode)}
            </span>
          </div>
          <Separator className="bg-[#e5e5e5]" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#1a1a1a]">Total</span>
            <span className="text-lg font-medium text-[#1a1a1a]">
              {formatPrice(order.total, currencyCode)}
            </span>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      {order.shipping_address && (
        <div className="mt-6 rounded-lg border border-[#e5e5e5] bg-white p-6">
          <h3 className="text-sm font-medium text-[#1a1a1a]">
            Endereco de entrega
          </h3>
          <div className="mt-3 text-sm text-[#1a1a1a]/70">
            <p>
              {order.shipping_address.first_name}{" "}
              {order.shipping_address.last_name}
            </p>
            {order.shipping_address.address_1 && (
              <p>{order.shipping_address.address_1}</p>
            )}
            {order.shipping_address.address_2 && (
              <p>{order.shipping_address.address_2}</p>
            )}
            <p>
              {[
                order.shipping_address.city,
                order.shipping_address.province,
                order.shipping_address.postal_code,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
            {order.shipping_address.phone && (
              <p className="mt-1">Tel: {order.shipping_address.phone}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
