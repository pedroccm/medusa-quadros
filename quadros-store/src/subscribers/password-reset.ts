import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

const STORE_URL = process.env.STORE_URL || "http://localhost:3000"

export default async function passwordResetHandler({
  event: { data },
  container,
}: SubscriberArgs<{ entity_id: string; token: string; actor_type: string }>) {
  try {
    if (data.actor_type !== "customer") return

    const storeService = container.resolve("store")
    const [store] = await storeService.listStores()
    const settings = (store?.metadata as Record<string, unknown>)?.email_settings as Record<string, unknown> | undefined

    const resetUrl = `${STORE_URL}/resetar-senha?token=${data.token}&email=${encodeURIComponent(data.entity_id)}`

    const notificationService = container.resolve("notification")
    await notificationService.createNotifications({
      to: data.entity_id,
      channel: "email",
      template: "password-reset",
      provider_id: "resend",
      data: {
        url: resetUrl,
        from_email: settings?.from_email,
        from_name: settings?.from_name,
      },
    })
  } catch (error) {
    console.error("Failed to send password reset email:", error)
  }
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
