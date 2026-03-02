import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

export default async function customerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const storeService = container.resolve("store")
    const [store] = await storeService.listStores()
    const settings = (store?.metadata as Record<string, unknown>)?.email_settings as Record<string, unknown> | undefined

    if (!settings) return

    const enabled = settings.enabled as Record<string, boolean> | undefined
    if (!enabled?.welcome) return

    const customerService = container.resolve("customer")
    const customer = await customerService.retrieveCustomer(data.id)

    if (!customer.email) return

    const notificationService = container.resolve("notification")
    await notificationService.createNotifications({
      to: customer.email,
      channel: "email",
      template: "welcome",
      provider_id: "resend",
      data: {
        customer: {
          first_name: customer.first_name,
          email: customer.email,
        },
        from_email: settings.from_email,
        from_name: settings.from_name,
      },
    })
  } catch (error) {
    console.error("Failed to send welcome email:", error)
  }
}

export const config: SubscriberConfig = {
  event: "customer.created",
}
