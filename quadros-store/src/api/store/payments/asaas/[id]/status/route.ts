import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const ASAAS_ACCESS_TOKEN = process.env.ASAAS_ACCESS_TOKEN || ""
const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://api.asaas.com/v3"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id } = req.params

    if (!id) {
      res.status(400).json({ message: "Payment ID is required" })
      return
    }

    const asaasResponse = await fetch(`${ASAAS_API_URL}/payments/${id}`, {
      method: "GET",
      headers: {
        "access_token": ASAAS_ACCESS_TOKEN,
      },
    })

    const payment = await asaasResponse.json()

    if (!asaasResponse.ok) {
      throw {
        message: payment.message || "Failed to fetch payment status",
        status: asaasResponse.status,
      }
    }

    res.json({
      payment_id: payment.id,
      status: payment.status,
      status_detail: payment.status,
      value: payment.value,
      billingType: payment.billingType,
      invoiceUrl: payment.invoiceUrl,
      pixCodice: payment.pixCodice,
      pixEncodedImage: payment.pixEncodedImage,
      dueDate: payment.dueDate,
    })
  } catch (error: any) {
    console.error("Asaas payment status error:", JSON.stringify(error, null, 2))
    const status = error?.status || 500
    res.status(status).json({
      message: error?.message || "Failed to fetch payment status",
    })
  }
}
