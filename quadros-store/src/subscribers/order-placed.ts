import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const storeService = container.resolve("store")
    const [store] = await storeService.listStores()
    const settings = (store?.metadata as Record<string, unknown>)?.email_settings as Record<string, unknown> | undefined

    if (!settings) return

    const enabled = settings.enabled as Record<string, boolean> | undefined
    if (!enabled?.order_placed) return

    const orderService = container.resolve("order")
    const order = await orderService.retrieveOrder(data.id, {
      relations: ["items", "shipping_address"],
    })

    if (!order.email) return

    const notificationService = container.resolve("notification")
    await notificationService.createNotifications({
      to: order.email,
      channel: "email",
      template: "order-placed",
      provider_id: "resend",
      data: {
        order: {
          display_id: order.display_id,
          items: order.items,
          total: order.total,
          subtotal: order.subtotal,
          shipping_total: order.shipping_total,
          shipping_address: order.shipping_address,
          currency_code: order.currency_code,
        },
        from_email: settings.from_email,
        from_name: settings.from_name,
      },
    })
  } catch (error) {
    console.error("Failed to send order placed email:", error)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
