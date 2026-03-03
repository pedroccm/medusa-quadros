import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const ASAAS_ACCESS_TOKEN = process.env.ASAAS_ACCESS_TOKEN || ""
const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://api.asaas.com/v3"

const LOG_PREFIX = "[ASAAS-STATUS]"

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

    console.log(`${LOG_PREFIX} Checking payment: ${id}`)

    const asaasResponse = await fetch(`${ASAAS_API_URL}/payments/${id}`, {
      method: "GET",
      headers: {
        "access_token": ASAAS_ACCESS_TOKEN,
      },
    })

    const payment = await asaasResponse.json()

    if (!asaasResponse.ok) {
      console.error(`${LOG_PREFIX} Failed (${asaasResponse.status}):`, JSON.stringify(payment, null, 2))
      throw {
        message: payment.message || "Failed to fetch payment status",
        status: asaasResponse.status,
      }
    }

    console.log(`${LOG_PREFIX} ${id} -> ${payment.status} (${payment.billingType}) R$${payment.value}`)

    res.json({
      payment_id: payment.id,
      status: payment.status,
      status_detail: payment.status,
      value: payment.value,
      billingType: payment.billingType,
      invoiceUrl: payment.invoiceUrl,
      dueDate: payment.dueDate,
    })
  } catch (error: any) {
    console.error(`${LOG_PREFIX} Error:`, JSON.stringify(error, null, 2))
    const status = error?.status || 500
    res.status(status).json({
      message: error?.message || "Failed to fetch payment status",
    })
  }
}
