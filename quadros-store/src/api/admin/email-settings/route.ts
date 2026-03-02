import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const DEFAULT_SETTINGS = {
  from_email: "onboarding@resend.dev",
  from_name: "Quadros Store",
  enabled: {
    order_placed: true,
    order_shipped: true,
    welcome: true,
  },
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const storeService = req.scope.resolve("store")
  const [store] = await storeService.listStores()

  const metadata = (store?.metadata || {}) as Record<string, unknown>
  const emailSettings = metadata.email_settings || DEFAULT_SETTINGS

  res.json({ email_settings: emailSettings })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const storeService = req.scope.resolve("store")
  const [store] = await storeService.listStores()

  if (!store) {
    res.status(404).json({ message: "Store not found" })
    return
  }

  const body = req.body as Record<string, unknown>
  const currentMetadata = (store.metadata || {}) as Record<string, unknown>

  const updatedMetadata = {
    ...currentMetadata,
    email_settings: body,
  }

  await storeService.updateStores(store.id, {
    metadata: updatedMetadata,
  })

  res.json({ email_settings: body })
}
