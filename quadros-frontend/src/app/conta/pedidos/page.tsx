"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { getCustomerOrders, formatPrice, type MedusaOrder } from "@/lib/medusa"
import { Badge } from "@/components/ui/badge"

const AUTH_TOKEN_KEY = "quadros_auth_token"

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Concluido
        </Badge>
      )
    case "canceled":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          Cancelado
        </Badge>
      )
    case "requires_action":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Acao necessaria
        </Badge>
      )
    case "pending":
    default:
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Pendente
        </Badge>
      )
  }
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateString))
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<MedusaOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchOrders() {
      const token = localStorage.getItem(AUTH_TOKEN_KEY)
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const { orders: fetchedOrders } = await getCustomerOrders(token)
        setOrders(fetchedOrders || [])
      } catch (err: any) {
        // Token expired or invalid - clear it
        if (err?.message?.includes("401") || err?.message?.includes("Unauthorized")) {
          localStorage.removeItem(AUTH_TOKEN_KEY)
        } else {
          setError("Erro ao carregar pedidos.")
        }
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-[#1a1a1a]/40" />
      </div>
    )
  }

  return (
    <div>
      <h2 className="font-serif text-xl text-[#1a1a1a]">Meus Pedidos</h2>

      {error && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}

      {!error && orders.length === 0 && (
        <div className="mt-6 rounded-lg border border-[#e5e5e5] bg-white p-8 text-center">
          <p className="text-sm text-[#1a1a1a]/50">
            Voce ainda nao fez nenhum pedido.
          </p>
        </div>
      )}

      {orders.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-lg border border-[#e5e5e5] bg-white">
          {/* Desktop table header */}
          <div className="hidden border-b border-[#e5e5e5] px-6 py-3 sm:grid sm:grid-cols-4 sm:gap-4">
            <p className="text-xs uppercase tracking-wider text-[#1a1a1a]/40">
              Pedido
            </p>
            <p className="text-xs uppercase tracking-wider text-[#1a1a1a]/40">
              Data
            </p>
            <p className="text-xs uppercase tracking-wider text-[#1a1a1a]/40">
              Status
            </p>
            <p className="text-right text-xs uppercase tracking-wider text-[#1a1a1a]/40">
              Total
            </p>
          </div>

          {/* Order rows */}
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/conta/pedidos/${order.id}`}
              className="block border-b border-[#e5e5e5] px-6 py-4 transition-colors last:border-b-0 hover:bg-[#fafafa]"
            >
              {/* Mobile layout */}
              <div className="flex items-center justify-between sm:hidden">
                <div>
                  <p className="text-sm font-medium text-[#1a1a1a]">
                    #{order.display_id}
                  </p>
                  <p className="mt-0.5 text-xs text-[#1a1a1a]/50">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="mb-1">{getStatusBadge(order.status)}</div>
                  <p className="text-sm text-[#1a1a1a]">
                    {formatPrice(order.total, order.currency_code?.toUpperCase() || "BRL")}
                  </p>
                </div>
              </div>

              {/* Desktop layout */}
              <div className="hidden sm:grid sm:grid-cols-4 sm:items-center sm:gap-4">
                <p className="text-sm font-medium text-[#1a1a1a]">
                  #{order.display_id}
                </p>
                <p className="text-sm text-[#1a1a1a]/60">
                  {formatDate(order.created_at)}
                </p>
                <div>{getStatusBadge(order.status)}</div>
                <p className="text-right text-sm text-[#1a1a1a]">
                  {formatPrice(order.total, order.currency_code?.toUpperCase() || "BRL")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
