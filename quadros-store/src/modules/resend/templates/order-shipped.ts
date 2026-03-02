interface ShipmentData {
  order?: {
    display_id?: number
    currency_code?: string
  }
  fulfillment?: {
    tracking_numbers?: string[]
    tracking_links?: { url: string }[]
  }
}

export function orderShippedTemplate(data: Record<string, unknown>): {
  subject: string
  html: string
} {
  const { order, fulfillment } = data as unknown as ShipmentData
  const displayId = order?.display_id || "—"
  const trackingNumbers = fulfillment?.tracking_numbers || []
  const trackingLinks = fulfillment?.tracking_links || []

  const trackingHtml = trackingNumbers.length
    ? trackingNumbers
        .map((num, i) => {
          const link = trackingLinks[i]?.url
          return link
            ? `<a href="${link}" style="color: #1a1a1a; font-weight: 600; text-decoration: underline;">${num}</a>`
            : `<span style="color: #1a1a1a; font-weight: 600;">${num}</span>`
        })
        .join(", ")
    : null

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
            <h2 style="margin: 0 0 8px; font-size: 22px; color: #1a1a1a; font-weight: 600;">Pedido Enviado!</h2>
            <p style="margin: 0 0 24px; color: #666; font-size: 14px;">Pedido #${displayId}</p>

            <p style="color: #444; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
              Seu pedido foi despachado e está a caminho! Você receberá atualizações sobre o status da entrega.
            </p>

            ${
              trackingHtml
                ? `<div style="background-color: #fafafa; border: 1px solid #e5e5e5; padding: 20px; margin-bottom: 24px;">
                    <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666;">Código de Rastreamento</p>
                    <p style="margin: 0; font-size: 16px;">${trackingHtml}</p>
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
    subject: `Pedido #${displayId} enviado — Quadros Store`,
    html,
  }
}
