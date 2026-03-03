import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const ASAAS_ACCESS_TOKEN = process.env.ASAAS_ACCESS_TOKEN || ""
const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://api.asaas.com/v3"

const LOG_PREFIX = "[ASAAS]"

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
  phone?: string
  credit_card?: {
    holder_name: string
    number: string
    expiry_month: string
    expiry_year: string
    security_code: string
  }
  installments?: number
  address?: {
    postalCode?: string
    addressNumber?: string
  }
}

// Helper: Make authenticated request to Asaas API
async function asaasRequest(path: string, method: string = "GET", body?: unknown) {
  const url = `${ASAAS_API_URL}${path}`
  console.log(`${LOG_PREFIX} ${method} ${path}`)

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "access_token": ASAAS_ACCESS_TOKEN,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  const data = await response.json()

  if (!response.ok) {
    console.error(`${LOG_PREFIX} ${method} ${path} FAILED (${response.status}):`, JSON.stringify(data, null, 2))
    throw {
      message: data.errors?.[0]?.description || data.message || "Asaas API error",
      status: response.status,
      cause: data.errors || [],
      endpoint: path,
    }
  }

  console.log(`${LOG_PREFIX} ${method} ${path} OK (${response.status})`)
  return data
}

// Mask card number for safe logging: 5162****8829
function maskCard(number: string): string {
  if (number.length < 8) return "****"
  return number.slice(0, 4) + "****" + number.slice(-4)
}

// Find or create Asaas customer by CPF
async function findOrCreateCustomer(payer: AsaasPaymentBody["payer"], phone?: string): Promise<string> {
  const cpf = payer.identification.number.replace(/\D/g, "")
  console.log(`${LOG_PREFIX} Finding customer by CPF: ***${cpf.slice(-4)}`)

  const searchResult = await asaasRequest(`/customers?cpfCnpj=${cpf}`)
  if (searchResult.data && searchResult.data.length > 0) {
    console.log(`${LOG_PREFIX} Found existing customer: ${searchResult.data[0].id}`)
    return searchResult.data[0].id
  }

  console.log(`${LOG_PREFIX} Customer not found, creating new...`)
  const customerData: Record<string, unknown> = {
    name: `${payer.first_name} ${payer.last_name}`.trim(),
    email: payer.email,
    cpfCnpj: cpf,
  }

  if (phone) {
    const phoneDigits = phone.replace(/\D/g, "")
    if (phoneDigits.length >= 10) {
      customerData.mobilePhone = phoneDigits
    }
  }

  const newCustomer = await asaasRequest("/customers", "POST", customerData)
  console.log(`${LOG_PREFIX} Created customer: ${newCustomer.id}`)
  return newCustomer.id
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const startTime = Date.now()
  const method = "?"

  try {
    const body = req.body as AsaasPaymentBody
    const paymentMethod = body.payment_method || "unknown"

    console.log(`${LOG_PREFIX} ========== NEW PAYMENT ==========`)
    console.log(`${LOG_PREFIX} Method: ${paymentMethod} | Total: R$${body.total} | Cart: ${body.cart_id}`)
    console.log(`${LOG_PREFIX} Payer: ${body.payer?.first_name} ${body.payer?.last_name} <${body.payer?.email}>`)

    if (!body.cart_id || !body.payment_method || !body.payer) {
      console.error(`${LOG_PREFIX} Missing required fields`)
      res.status(400).json({ message: "Missing required fields: cart_id, payment_method, payer" })
      return
    }

    if (!body.total || body.total <= 0) {
      console.error(`${LOG_PREFIX} Invalid total: ${body.total}`)
      res.status(400).json({ message: "Invalid total amount" })
      return
    }

    // Step 1: Find or create customer
    console.log(`${LOG_PREFIX} Step 1: Customer lookup...`)
    const customerId = await findOrCreateCustomer(body.payer, body.phone || body.payer.phone)

    // Step 2: Build payment data
    console.log(`${LOG_PREFIX} Step 2: Building payment data...`)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 1)
    const dueDateStr = dueDate.toISOString().split("T")[0]

    const paymentData: Record<string, unknown> = {
      customer: customerId,
      billingType: paymentMethod === "pix" ? "PIX" : "CREDIT_CARD",
      value: Math.round(body.total * 100) / 100,
      dueDate: dueDateStr,
      externalReference: body.cart_id,
      description: body.description || "Quadros Store - Pedido",
    }

    // Credit card specific fields
    if (paymentMethod === "credit_card" && body.credit_card) {
      console.log(`${LOG_PREFIX} Card: ${maskCard(body.credit_card.number)} | Holder: ${body.credit_card.holder_name} | Installments: ${body.installments || 1}`)

      paymentData.creditCard = {
        holderName: body.credit_card.holder_name,
        number: body.credit_card.number,
        expiryMonth: body.credit_card.expiry_month,
        expiryYear: body.credit_card.expiry_year,
        ccv: body.credit_card.security_code,
      }

      const phone = (body.phone || body.payer.phone || "").replace(/\D/g, "")
      paymentData.creditCardHolderInfo = {
        name: `${body.payer.first_name} ${body.payer.last_name}`.trim(),
        email: body.payer.email,
        cpfCnpj: body.payer.identification.number.replace(/\D/g, ""),
        postalCode: body.address?.postalCode || "00000000",
        addressNumber: body.address?.addressNumber || "0",
        phone: phone || undefined,
        mobilePhone: phone || undefined,
      }

      if (body.installments && body.installments > 1) {
        paymentData.installmentCount = body.installments
        paymentData.installmentValue = Math.round((body.total / body.installments) * 100) / 100
        console.log(`${LOG_PREFIX} Installments: ${body.installments}x R$${paymentData.installmentValue}`)
      }

      const ip = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || req.ip
      if (ip) {
        paymentData.remoteIp = Array.isArray(ip) ? ip[0] : ip.split(",")[0].trim()
        console.log(`${LOG_PREFIX} Remote IP: ${paymentData.remoteIp}`)
      }
    }

    // Step 3: Create payment
    console.log(`${LOG_PREFIX} Step 3: Creating ${paymentMethod} payment...`)
    const payment = await asaasRequest("/payments", "POST", paymentData)
    console.log(`${LOG_PREFIX} Payment created! ID: ${payment.id} | Status: ${payment.status}`)

    const result: Record<string, unknown> = {
      payment_id: payment.id,
      status: payment.status,
      status_detail: payment.status,
    }

    // Step 4: For PIX, fetch QR code
    if (paymentMethod === "pix") {
      console.log(`${LOG_PREFIX} Step 4: Fetching PIX QR code...`)
      try {
        const pixData = await asaasRequest(`/payments/${payment.id}/pixQrCode`)
        result.qr_code = pixData.payload
        result.qr_code_base64 = pixData.encodedImage
        console.log(`${LOG_PREFIX} PIX QR code generated (payload length: ${pixData.payload?.length || 0})`)
      } catch (pixError: any) {
        console.error(`${LOG_PREFIX} PIX QR code FAILED: ${pixError.message}`)
        console.error(`${LOG_PREFIX} PIX error details:`, JSON.stringify(pixError, null, 2))
      }
      result.ticket_url = payment.invoiceUrl
    }

    // Credit card response
    if (paymentMethod === "credit_card") {
      if (payment.creditCardToken) {
        result.credit_card_token = payment.creditCardToken
        console.log(`${LOG_PREFIX} Card token saved for future use`)
      }
    }

    const elapsed = Date.now() - startTime
    console.log(`${LOG_PREFIX} SUCCESS | ${paymentMethod} | ${payment.id} | ${payment.status} | ${elapsed}ms`)
    console.log(`${LOG_PREFIX} ================================`)

    res.json(result)
  } catch (error: any) {
    const elapsed = Date.now() - startTime
    console.error(`${LOG_PREFIX} ========== PAYMENT FAILED ==========`)
    console.error(`${LOG_PREFIX} Elapsed: ${elapsed}ms`)
    console.error(`${LOG_PREFIX} Endpoint: ${error?.endpoint || "unknown"}`)
    console.error(`${LOG_PREFIX} Message: ${error?.message}`)
    console.error(`${LOG_PREFIX} Status: ${error?.status}`)
    console.error(`${LOG_PREFIX} Cause:`, JSON.stringify(error?.cause || [], null, 2))
    console.error(`${LOG_PREFIX} Full error:`, JSON.stringify(error, null, 2))
    console.error(`${LOG_PREFIX} ====================================`)

    const status = error?.status || 500
    res.status(status).json({
      message: error?.message || "Failed to create Asaas payment",
      cause: error?.cause || error?.errors || [],
    })
  }
}
