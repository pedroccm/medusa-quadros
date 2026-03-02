import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MercadoPagoConfig, Payment } from "mercadopago"

const mpConfig = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const paymentId = req.params.id

    if (!paymentId) {
      res.status(400).json({ message: "Payment ID is required" })
      return
    }

    const paymentClient = new Payment(mpConfig)
    const payment = await paymentClient.get({ id: Number(paymentId) })

    res.json({
      payment_id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
    })
  } catch (error: any) {
    console.error("Payment status error:", error?.message || error)
    res.status(error?.status || 500).json({
      message: error?.message || "Failed to get payment status",
    })
  }
}
