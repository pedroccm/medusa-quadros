import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import crypto from "crypto"

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || ""

interface CreatePaymentBody {
  cart_id: string
  payment_method: "pix" | "credit_card" | "bolbradesco"
  payer: {
    email: string
    first_name: string
    last_name: string
    identification: {
      type: string
      number: string
    }
  }
  token?: string
  installments?: number
  payment_method_id?: string
  issuer_id?: string
  total: number
  description?: string
  phone?: string
  address?: {
    street_name: string
    street_number: string
    zip_code: string
    city: string
    state: string
    neighborhood: string
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = req.body as CreatePaymentBody

    if (!body.cart_id || !body.payment_method || !body.payer) {
      res.status(400).json({ message: "Missing required fields: cart_id, payment_method, payer" })
      return
    }

    if (body.payment_method === "credit_card" && !body.token) {
      res.status(400).json({ message: "Token is required for credit card payments" })
      return
    }

    if (!body.total || body.total <= 0) {
      res.status(400).json({ message: "Invalid total amount" })
      return
    }

    const phoneDigits = (body.phone || "").replace(/\D/g, "")
    const areaCode = phoneDigits.slice(0, 2)
    const phoneNumber = phoneDigits.slice(2)

    const paymentBody: Record<string, unknown> = {
      transaction_amount: Math.round(body.total * 100) / 100,
      description: body.description || "Quadros Store - Pedido",
      payment_method_id: body.payment_method === "pix" ? "pix" : body.payment_method === "bolbradesco" ? "bolbradesco" : body.payment_method_id,
      payer: {
        email: body.payer.email,
        first_name: body.payer.first_name,
        last_name: body.payer.last_name,
        identification: body.payer.identification,
        ...(phoneDigits && {
          phone: {
            area_code: areaCode,
            number: phoneNumber,
          },
        }),
        ...(body.address && {
          address: {
            zip_code: body.address.zip_code,
            street_name: body.address.street_name,
            street_number: body.address.street_number,
            neighborhood: body.address.neighborhood,
            city: body.address.city,
            federal_unit: body.address.state,
          },
        }),
      },
      additional_info: {
        payer: {
          first_name: body.payer.first_name,
          last_name: body.payer.last_name,
          ...(phoneDigits && {
            phone: {
              area_code: areaCode,
              number: phoneNumber,
            },
          }),
          ...(body.address && {
            address: {
              zip_code: body.address.zip_code,
              street_name: body.address.street_name,
              street_number: body.address.street_number,
            },
          }),
        },
        ...(body.address && {
          shipments: {
            receiver_address: {
              zip_code: body.address.zip_code,
              street_name: body.address.street_name,
              street_number: body.address.street_number,
              city_name: body.address.city,
              state_name: body.address.state,
            },
          },
        }),
      },
      metadata: {
        cart_id: body.cart_id,
      },
    }

    if (body.payment_method === "credit_card") {
      paymentBody.token = body.token
      paymentBody.installments = body.installments || 1
      if (body.issuer_id) {
        const parsedIssuerId = Number(body.issuer_id)
        if (!isNaN(parsedIssuerId)) {
          paymentBody.issuer_id = parsedIssuerId
        }
      }
    }

    if (body.payment_method === "pix") {
      paymentBody.payment_method_id = "pix"
    }

    if (body.payment_method === "bolbradesco") {
      paymentBody.payment_method_id = "bolbradesco"
    }

    console.log("Creating MP payment with body:", JSON.stringify(paymentBody, null, 2))

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(paymentBody),
    })

    const payment = await mpResponse.json()
    console.log("MP response status:", mpResponse.status, "body:", JSON.stringify(payment, null, 2))

    if (!mpResponse.ok) {
      throw {
        message: payment.message || "Payment creation failed",
        status: mpResponse.status,
        cause: payment.cause || [],
      }
    }

    const result: Record<string, unknown> = {
      payment_id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
    }

    if (body.payment_method === "pix" && payment.point_of_interaction?.transaction_data) {
      result.qr_code = payment.point_of_interaction.transaction_data.qr_code
      result.qr_code_base64 = payment.point_of_interaction.transaction_data.qr_code_base64
      result.ticket_url = payment.point_of_interaction.transaction_data.ticket_url
    }

    if (body.payment_method === "bolbradesco") {
      result.barcode = payment.barcode?.content
      result.ticket_url = payment.transaction_details?.external_resource_url
    }

    res.json(result)
  } catch (error: any) {
    console.error("Payment creation error:", JSON.stringify(error, null, 2))
    console.error("Payment creation error message:", error?.message)
    console.error("Payment creation error cause:", error?.cause)
    const status = error?.status || 500
    res.status(status).json({
      message: error?.message || "Failed to create payment",
      cause: error?.cause || [],
    })
  }
}
