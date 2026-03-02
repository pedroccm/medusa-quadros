import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const FRENET_TOKEN = process.env.FRENET_TOKEN || ""
const CEP_ORIGIN = process.env.FRENET_CEP_ORIGIN || "05624080"

interface ShippingItem {
  quantity: number
  variant_title: string
}

interface CalculateBody {
  to_cep: string
  items: ShippingItem[]
}

interface ProductDimensions {
  width: number
  height: number
  length: number
  weight: number
}

function getDimensions(variantTitle: string): ProductDimensions {
  const lower = variantTitle.toLowerCase()

  if (lower.includes("20x30") || lower.includes("20 x 30")) {
    return { width: 24, height: 34, length: 5, weight: 0.5 }
  }
  if (lower.includes("30x40") || lower.includes("30 x 40")) {
    return { width: 34, height: 44, length: 5, weight: 0.8 }
  }
  if (lower.includes("40x60") || lower.includes("40 x 60")) {
    return { width: 44, height: 64, length: 6, weight: 1.2 }
  }

  // Fallback: 30x40 dimensions
  return { width: 34, height: 44, length: 5, weight: 0.8 }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = req.body as CalculateBody

    if (!body.to_cep || !body.items?.length) {
      res.status(400).json({ message: "Missing required fields: to_cep, items" })
      return
    }

    const toCep = body.to_cep.replace(/\D/g, "")
    if (toCep.length !== 8) {
      res.status(400).json({ message: "Invalid CEP format" })
      return
    }

    // Calculate total invoice value and build shipping items
    let totalWeight = 0
    let maxWidth = 0
    let maxLength = 0
    let totalHeight = 0

    const shippingItems = body.items.map((item) => {
      const dims = getDimensions(item.variant_title)
      totalWeight += dims.weight * item.quantity
      maxWidth = Math.max(maxWidth, dims.width)
      maxLength = Math.max(maxLength, dims.length)
      totalHeight += dims.height * item.quantity

      return {
        Weight: dims.weight,
        Length: dims.length,
        Height: dims.height,
        Width: dims.width,
        Diameter: 0,
        SKU: "quadro",
        Category: "Quadros Decorativos",
        isFragile: true,
        Quantity: item.quantity,
      }
    })

    const frenetPayload = {
      SellerCEP: CEP_ORIGIN,
      RecipientCEP: toCep,
      RecipientCountry: "BR",
      ShipmentInvoiceValue: 100,
      ShippingItemArray: shippingItems,
    }

    const frenetResponse = await fetch("https://private-anon-7e44c2a5b8-frabordeliveryapi.apiary-proxy.com/shipping/quote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: FRENET_TOKEN,
      },
      body: JSON.stringify(frenetPayload),
    })

    if (!frenetResponse.ok) {
      const errorText = await frenetResponse.text()
      console.error("Frenet API error:", frenetResponse.status, errorText)

      // Fallback: try the main API URL
      const fallbackResponse = await fetch("https://api.frenet.com.br/shipping/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: FRENET_TOKEN,
        },
        body: JSON.stringify(frenetPayload),
      })

      if (!fallbackResponse.ok) {
        const fallbackError = await fallbackResponse.text()
        console.error("Frenet fallback API error:", fallbackResponse.status, fallbackError)
        res.status(502).json({ message: "Failed to calculate shipping" })
        return
      }

      const fallbackData = await fallbackResponse.json()
      const options = mapFrenetResponse(fallbackData)
      res.json({ shipping_options: options })
      return
    }

    const frenetData = await frenetResponse.json()
    const options = mapFrenetResponse(frenetData)
    res.json({ shipping_options: options })
  } catch (error: any) {
    console.error("Shipping calculation error:", error?.message || error)
    res.status(500).json({
      message: error?.message || "Failed to calculate shipping",
    })
  }
}

function mapFrenetResponse(data: any) {
  const services = data?.ShippingSevicesArray || data?.ShippingServicesArray || []

  return services
    .filter((svc: any) => !svc.Error && svc.ShippingPrice > 0)
    .map((svc: any) => ({
      id: String(svc.ServiceCode),
      name: svc.ServiceDescription || svc.Carrier || "Transportadora",
      company: svc.Carrier || svc.ServiceDescription || "Transportadora",
      price: parseFloat(svc.ShippingPrice),
      delivery_min: svc.DeliveryTime || 0,
      delivery_max: svc.DeliveryTime || 0,
    }))
}
