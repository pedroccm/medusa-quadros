import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

export default async function orderFulfilledHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; order_id: string }>) {
  try {
    const storeService = container.resolve("store")
    const [store] = await storeService.listStores()
    const settings = (store?.metadata as Record<string, unknown>)?.email_settings as Record<string, unknown> | undefined

    if (!settings) return

    const enabled = settings.enabled as Record<string, boolean> | undefined
    if (!enabled?.order_shipped) return

    const orderService = container.resolve("order")
    const orderId = data.order_id || data.id
    const order = await orderService.retrieveOrder(orderId, {
      relations: ["fulfillments"],
    })

    if (!order.email) return

    const fulfillment = order.fulfillments?.[order.fulfillments.length - 1]

    const notificationService = container.resolve("notification")
    await notificationService.createNotifications({
      to: order.email,
      channel: "email",
      template: "order-shipped",
      provider_id: "resend",
      data: {
        order: {
          display_id: order.display_id,
          currency_code: order.currency_code,
        },
        fulfillment: fulfillment
          ? {
              tracking_numbers: fulfillment.tracking_numbers || [],
              tracking_links: fulfillment.tracking_links || [],
            }
          : undefined,
        from_email: settings.from_email,
        from_name: settings.from_name,
      },
    })
  } catch (error) {
    console.error("Failed to send order shipped email:", error)
  }
}

export const config: SubscriberConfig = {
  event: "order.fulfillment_created",
}
