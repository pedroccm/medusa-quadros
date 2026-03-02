import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as { email_type: string; to_email: string }

  if (!body.email_type || !body.to_email) {
    res.status(400).json({ message: "email_type and to_email are required" })
    return
  }

  const storeService = req.scope.resolve("store")
  const [store] = await storeService.listStores()
  const metadata = (store?.metadata || {}) as Record<string, unknown>
  const settings = (metadata.email_settings || {}) as Record<string, unknown>

  const templateMap: Record<string, string> = {
    order_placed: "order-placed",
    order_shipped: "order-shipped",
    welcome: "welcome",
  }

  const template = templateMap[body.email_type]
  if (!template) {
    res.status(400).json({ message: `Unknown email type: ${body.email_type}` })
    return
  }

  const sampleData: Record<string, Record<string, unknown>> = {
    "order-placed": {
      order: {
        display_id: 1234,
        items: [
          { title: "Quadro Decorativo — Exemplo", quantity: 1, unit_price: 149.9 },
          { title: "Quadro Minimalista — Teste", quantity: 2, unit_price: 89.9 },
        ],
        total: 329.7,
        subtotal: 329.7,
        shipping_total: 0,
        shipping_address: {
          first_name: "João",
          last_name: "Silva",
          address_1: "Rua Exemplo, 123",
          city: "São Paulo",
          province: "SP",
          postal_code: "01234-567",
        },
        currency_code: "brl",
      },
    },
    "order-shipped": {
      order: { display_id: 1234, currency_code: "brl" },
      fulfillment: {
        tracking_numbers: ["BR123456789XX"],
        tracking_links: [],
      },
    },
    welcome: {
      customer: { first_name: "João", email: body.to_email },
    },
  }

  try {
    const notificationService = req.scope.resolve("notification")
    await notificationService.createNotifications({
      to: body.to_email,
      channel: "email",
      template,
      provider_id: "resend",
      data: {
        ...sampleData[template],
        from_email: settings.from_email || "onboarding@resend.dev",
        from_name: settings.from_name || "Quadros Store",
      },
    })

    res.json({ success: true, message: `Test email sent to ${body.to_email}` })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    res.status(500).json({ success: false, message })
  }
}
