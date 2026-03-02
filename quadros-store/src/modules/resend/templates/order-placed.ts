interface OrderItem {
  title: string
  quantity: number
  unit_price: number
  thumbnail?: string
}

interface OrderData {
  order?: {
    display_id?: number
    items?: OrderItem[]
    total?: number
    subtotal?: number
    shipping_total?: number
    shipping_address?: {
      first_name?: string
      last_name?: string
      address_1?: string
      city?: string
      province?: string
      postal_code?: string
    }
    currency_code?: string
  }
}

function formatBRL(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount)
}

export function orderPlacedTemplate(data: Record<string, unknown>): {
  subject: string
  html: string
} {
  const { order } = data as unknown as OrderData
  const displayId = order?.display_id || "—"
  const items = order?.items || []
  const total = order?.total || 0
  const subtotal = order?.subtotal || 0
  const shippingTotal = order?.shipping_total || 0
  const addr = order?.shipping_address

  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
        <strong style="color: #1a1a1a;">${item.title}</strong><br/>
        <span style="color: #666; font-size: 13px;">Qtd: ${item.quantity}</span>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; text-align: right; color: #1a1a1a;">
        ${formatBRL(item.unit_price * item.quantity)}
      </td>
    </tr>`
    )
    .join("")

  const addressHtml = addr
    ? `<p style="color: #666; font-size: 14px; line-height: 1.5; margin: 0;">
        ${addr.first_name || ""} ${addr.last_name || ""}<br/>
        ${addr.address_1 || ""}<br/>
        ${addr.city || ""}, ${addr.province || ""} - ${addr.postal_code || ""}
      </p>`
    : ""

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin: 0; padding: 0; background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; padding: 40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e5e5e5;">
        <!-- Header -->
        <tr>
          <td style="padding: 32px 40px; border-bottom: 1px solid #e5e5e5;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #1a1a1a; letter-spacing: 2px;">QUADROS</h1>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding: 40px;">
            <h2 style="margin: 0 0 8px; font-size: 22px; color: #1a1a1a; font-weight: 600;">Pedido Confirmado</h2>
            <p style="margin: 0 0 24px; color: #666; font-size: 14px;">Pedido #${displayId}</p>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding: 8px 0; border-bottom: 2px solid #1a1a1a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666;">Item</td>
                <td style="padding: 8px 0; border-bottom: 2px solid #1a1a1a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666; text-align: right;">Valor</td>
              </tr>
              ${itemsHtml}
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 14px;">Subtotal</td>
                <td style="padding: 8px 0; text-align: right; color: #666; font-size: 14px;">${formatBRL(subtotal)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 14px;">Frete</td>
                <td style="padding: 8px 0; text-align: right; color: #666; font-size: 14px;">${formatBRL(shippingTotal)}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-top: 2px solid #1a1a1a; font-size: 16px; font-weight: 600; color: #1a1a1a;">Total</td>
                <td style="padding: 12px 0; border-top: 2px solid #1a1a1a; text-align: right; font-size: 16px; font-weight: 600; color: #1a1a1a;">${formatBRL(total)}</td>
              </tr>
            </table>

            ${
              addressHtml
                ? `<div style="margin-top: 32px;">
                    <h3 style="margin: 0 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #666;">Endereço de Entrega</h3>
                    ${addressHtml}
                  </div>`
                : ""
            }
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding: 24px 40px; border-top: 1px solid #e5e5e5; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #999;">Obrigado por comprar na Quadros Store.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return {
    subject: `Pedido #${displayId} confirmado — Quadros Store`,
    html,
  }
}
