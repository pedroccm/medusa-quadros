import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const ASAAS_ACCESS_TOKEN = process.env.ASAAS_ACCESS_TOKEN || ""
const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://api.asaas.com/v3"

interface AsaasPaymentBody {
  cart_id: string
  payment_method: "pix" | "credit_card"
  payer: {
    email: string
    first_name: string
    last_name: string
    identification: {
      type: string
      number: string
    }
    phone?: string
  }
  total: number
  description?: string
}

interface AsaasCustomer {
  name: string
  email: string
  phone?: string
  cpfCnpj: string
  postalCode?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  city?: string
  state?: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = req.body as AsaasPaymentBody

    if (!body.cart_id || !body.payment_method || !body.payer) {
      res.status(400).json({ message: "Missing required fields: cart_id, payment_method, payer" })
      return
    }

    if (!body.total || body.total <= 0) {
      res.status(400).json({ message: "Invalid total amount" })
      return
    }

    // Build customer object for Asaas
    const customer: AsaasCustomer = {
      name: `${body.payer.first_name} ${body.payer.last_name}`.trim(),
      email: body.payer.email,
      cpfCnpj: body.payer.identification.number,
    }

    // Add phone if provided (format:DDD+Number)
    if (body.payer.phone) {
      const phoneDigits = body.payer.phone.replace(/\D/g, "")
      if (phoneDigits.length >= 10) {
        customer.phone = phoneDigits
      }
    }

    // Get due date (today + 1 day for PIX)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 1)
    const dueDateStr = dueDate.toISOString().split('T')[0]

    // Build payment object for Asaas
    const paymentData: Record<string, unknown> = {
      customer: customer,
      billingType: body.payment_method === "pix" ? "PIX" : "CREDIT_CARD",
      value: Math.round(body.total * 100) / 100,
      dueDate: dueDateStr,
      externalReference: body.cart_id,
      description: body.description || "Quadros Store - Pedido",
    }

    console.log("Creating Asaas payment with data:", JSON.stringify(paymentData, null, 2))

    const asaasResponse = await fetch(`${ASAAS_API_URL}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_ACCESS_TOKEN,
      },
      body: JSON.stringify(paymentData),
    })

    const payment = await asaasResponse.json()
    console.log("Asaas response status:", asaasResponse.status, "body:", JSON.stringify(payment, null, 2))

    if (!asaasResponse.ok) {
      throw {
        message: payment.message || payment.description || "Payment creation failed",
        status: asaasResponse.status,
        cause: payment.errors || [],
      }
    }

    const result: Record<string, unknown> = {
      payment_id: payment.id,
      status: payment.status,
      status_detail: payment.status,
    }

    // PIX specific fields
    if (body.payment_method === "pix" && payment.pixCodice) {
      result.qr_code = payment.pixCodice
      result.qr_code_base64 = payment.pixEncodedImage
      result.ticket_url = payment.invoiceUrl
    }

    res.json(result)
  } catch (error: any) {
    console.error("Asaas payment creation error:", JSON.stringify(error, null, 2))
    const status = error?.status || 500
    res.status(status).json({
      message: error?.message || "Failed to create Asaas payment",
      cause: error?.cause || error?.errors || [],
    })
  }
}
