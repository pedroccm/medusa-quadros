import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Button, Input, Select, Label, Text, Badge } from "@medusajs/ui"
import { useState } from "react"

type Fulfillment = {
  id: string
  shipped_at: string | null
  delivered_at: string | null
  tracking_numbers: string[]
  metadata: Record<string, unknown> | null
}

type OrderItem = {
  id: string
  quantity: number
  detail?: { fulfilled_quantity?: number }
}

type OrderData = {
  id: string
  fulfillments: Fulfillment[]
  status: string
  items: OrderItem[]
}

// The widget
const OrderFulfillmentWidget = ({ data: { order } }: { data: { order: OrderData } }) => {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [carrier, setCarrier] = useState("correios")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Get latest fulfillment
  const latestFulfillment = order.fulfillments?.[order.fulfillments.length - 1]

  // Get fulfillment status
  const getFulfillmentStatus = () => {
    if (!latestFulfillment) return { label: "Pendente", color: "orange" }
    if (latestFulfillment.delivered_at) return { label: "Entregue", color: "green" }
    if (latestFulfillment.shipped_at) return { label: "Enviado", color: "blue" }
    return { label: "Pendente", color: "orange" }
  }

  const status = getFulfillmentStatus()

  const handleMarkAsShipped = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Prepare items to fulfill (all unfulfilled items)
      const itemsToFulfill = order.items
        .map((item) => {
          const fulfilledQty = item.detail?.fulfilled_quantity || 0
          const remainingQty = item.quantity - fulfilledQty
          return remainingQty > 0
            ? { id: item.id, quantity: remainingQty }
            : null
        })
        .filter((item): item is { id: string; quantity: number } => item !== null)

      if (itemsToFulfill.length === 0) {
        setError("Não há itens para fulfillment")
        return
      }

      // Call native Medusa endpoint
      const response = await fetch(`/admin/orders/${order.id}/fulfillments`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: itemsToFulfill,
          labels: trackingNumber
            ? [{ tracking_number: trackingNumber, tracking_url: "", label_url: "" }]
            : undefined,
          metadata: carrier ? { carrier } : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to mark as shipped")
      }

      setSuccess("Pedido marcado como enviado!")
      setTrackingNumber("")
      setTimeout(() => window.location.reload(), 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsDelivered = async () => {
    if (!latestFulfillment) {
      setError("Crie um fulfillment primeiro")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Call native Medusa endpoint
      const response = await fetch(
        `/admin/orders/${order.id}/fulfillments/${latestFulfillment.id}/mark-as-delivered`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to mark as delivered")
      }

      setSuccess("Pedido marcado como entregue!")
      setTimeout(() => window.location.reload(), 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const carrierOptions = [
    { value: "correios", label: "Correios" },
    { value: "jadlog", label: "JadLog" },
    { value: "sedex", label: "Sedex" },
    { value: "fedex", label: "FedEx" },
    { value: "dhl", label: "DHL" },
    { value: "outros", label: "Outros" },
  ]

  return (
    <Container className="divide-y p-0">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Text size="small" weight="plus" leading="compact">
            Status do Envio
          </Text>
          <Badge color={status.color as any}>{status.label}</Badge>
        </div>

        {latestFulfillment?.tracking_numbers && latestFulfillment.tracking_numbers.length > 0 && (
          <div className="mb-4">
            <Text size="small" className="text-ui-fg-subtle">
              Rastreio: {latestFulfillment.tracking_numbers.join(", ")}
            </Text>
            {latestFulfillment.metadata?.carrier && (
              <Text size="small" className="text-ui-fg-subtle block">
                Transportadora: {String(latestFulfillment.metadata.carrier)}
              </Text>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-small">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded text-green-600 text-small">
            {success}
          </div>
        )}

        {order.status !== "canceled" && !latestFulfillment?.delivered_at && (
          <>
            {!latestFulfillment?.shipped_at && (
              <>
                <div className="mb-3">
                  <Label size="small">Número de Rastreio (opcional)</Label>
                  <Input
                    size="small"
                    placeholder="EX123456789BR"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="mb-3">
                  <Label size="small">Transportadora</Label>
                  <Select
                    size="small"
                    value={carrier}
                    onValueChange={(value) => setCarrier(value)}
                  >
                    {carrierOptions.map((option) => (
                      <Select.Item key={option.value} value={option.value}>
                        {option.label}
                      </Select.Item>
                    ))}
                  </Select>
                </div>

                <Button
                  size="small"
                  variant="primary"
                  className="w-full"
                  onClick={handleMarkAsShipped}
                  disabled={loading}
                >
                  {loading ? "Processando..." : "Marcar como Enviado"}
                </Button>
              </>
            )}

            {latestFulfillment?.shipped_at && !latestFulfillment?.delivered_at && (
              <Button
                size="small"
                variant="secondary"
                className="w-full"
                onClick={handleMarkAsDelivered}
                disabled={loading}
              >
                {loading ? "Processando..." : "Marcar como Entregue"}
              </Button>
            )}
          </>
        )}

        {order.status === "canceled" && (
          <Text size="small" className="text-ui-fg-subtle text-center">
            Este pedido foi cancelado
          </Text>
        )}
      </div>
    </Container>
  )
}

// The widget's configurations
export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default OrderFulfillmentWidget
