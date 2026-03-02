import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    // Get today's date at midnight for filtering
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get total orders count
    const { data: allOrders } = await query.graph({
      entity: "order",
      fields: ["id", "status", "fulfillments", "fulfillments.delivered_at", "created_at", "total"],
      pagination: {
        take: 99999,
      },
    })

    // Calculate stats
    let pending = 0
    let shipped = 0
    let delivered = 0
    let canceled = 0
    let todayTotal = 0
    let todayRevenue = 0

    for (const order of allOrders) {
      // Count canceled
      if (order.status === "canceled") {
        canceled++
        continue
      }

      // Check if order is from today
      const orderDate = new Date(order.created_at)
      const isToday = orderDate >= today

      // Check fulfillment status
      const fulfillments = order.fulfillments || []
      const hasFulfillment = fulfillments.length > 0
      const isDelivered = fulfillments.some((f: any) => f.delivered_at)

      if (isDelivered) {
        delivered++
      } else if (hasFulfillment) {
        shipped++
      } else {
        pending++
      }

      // Today's stats
      if (isToday) {
        todayTotal++
        todayRevenue += Number(order.total || 0)
      }
    }

    res.json({
      stats: {
        pending,
        shipped,
        delivered,
        canceled,
        total: allOrders.length,
        today_total: todayTotal,
        today_revenue: todayRevenue,
      },
    })
  } catch (error) {
    console.error("Error fetching order stats:", error)
    res.status(500).json({
      message: error.message || "Failed to fetch order stats",
    })
  }
}
