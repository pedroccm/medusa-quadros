import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MercadoPagoConfig, Payment } from "mercadopago"

const mpConfig = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
})

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = req.body as Record<string, unknown>

    // Only process payment notifications
    if (body.type !== "payment") {
      res.status(200).json({ received: true })
      return
    }

    const paymentId = (body.data as any)?.id
    if (!paymentId) {
      res.status(200).json({ received: true })
      return
    }

    const paymentClient = new Payment(mpConfig)
    const payment = await paymentClient.get({ id: Number(paymentId) })

    console.log(`[MP Webhook] Payment ${paymentId} status: ${payment.status}`)

    if (payment.status === "approved") {
      const cartId = (payment.metadata as any)?.cart_id
      if (cartId) {
        console.log(`[MP Webhook] Payment approved for cart: ${cartId}`)
        // Cart metadata update can be added here when needed
      }
    }

    res.status(200).json({ received: true })
  } catch (error: any) {
    console.error("Webhook error:", error?.message || error)
    // Always return 200 to avoid MP retries
    res.status(200).json({ received: true, error: error?.message })
  }
}
