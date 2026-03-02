import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Badge } from "@medusajs/ui"
import { useState, useEffect } from "react"

type StatsData = {
  pending: number
  shipped: number
  delivered: number
  canceled: number
  total: number
  today_total: number
  today_revenue: number
}

// The widget
const OrderStatsWidget = () => {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/admin/orders/stats", {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          setStats(data.stats)
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100) // Medusa stores prices in cents
  }

  const StatCard = ({
    label,
    value,
    color,
    subtext,
  }: {
    label: string
    value: number | string
    color: "orange" | "blue" | "green" | "grey" | "red"
    subtext?: string
  }) => (
    <div className="flex flex-col gap-1 p-3 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
      <Text size="small" className="text-ui-fg-subtle">
        {label}
      </Text>
      <div className="flex items-center gap-2">
        {typeof value === "number" ? (
          <Heading size="2xl">{value}</Heading>
        ) : (
          <Text size="large" weight="plus">
            {value}
          </Text>
        )}
        {color && <Badge color={color as any} className="ml-auto" />}
      </div>
      {subtext && (
        <Text size="small" className="text-ui-fg-subtle">
          {subtext}
        </Text>
      )}
    </div>
  )

  if (loading || !stats) {
    return (
      <Container className="p-4">
        <Text size="small" className="text-ui-fg-subtle">
          Carregando estatísticas...
        </Text>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="p-4">
        <div className="mb-4">
          <Text size="small" weight="plus" leading="compact">
            Resumo de Pedidos
          </Text>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard label="Pendentes" value={stats.pending} color="orange" />
          <StatCard label="Enviados" value={stats.shipped} color="blue" />
          <StatCard label="Entregues" value={stats.delivered} color="green" />
          <StatCard label="Cancelados" value={stats.canceled} color="grey" />
        </div>

        <div className="border-t border-ui-border-base pt-4 mt-4">
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="Total de Pedidos"
              value={stats.total}
              color={undefined}
            />
            <StatCard
              label="Hoje"
              value={stats.today_total}
              subtext="pedidos hoje"
              color={undefined}
            />
            <StatCard
              label="Faturamento Hoje"
              value={formatCurrency(stats.today_revenue)}
              color={undefined}
            />
          </div>
        </div>
      </div>
    </Container>
  )
}

// The widget's configurations
export const config = defineWidgetConfig({
  zone: "order.list.before",
})

export default OrderStatsWidget
