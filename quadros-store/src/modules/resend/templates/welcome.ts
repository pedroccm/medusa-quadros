interface WelcomeData {
  customer?: {
    first_name?: string
    email?: string
  }
}

export function welcomeTemplate(data: Record<string, unknown>): {
  subject: string
  html: string
} {
  const { customer } = data as unknown as WelcomeData
  const name = customer?.first_name || "cliente"

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
            <h2 style="margin: 0 0 8px; font-size: 22px; color: #1a1a1a; font-weight: 600;">Bem-vindo!</h2>
            <p style="color: #444; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
              Olá, ${name}! Sua conta na Quadros Store foi criada com sucesso.
            </p>
            <p style="color: #444; font-size: 15px; line-height: 1.6; margin: 0 0 32px;">
              Explore nossa coleção de quadros e encontre a arte perfeita para transformar seus ambientes.
            </p>
            <a href="#" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 32px; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 0.5px;">
              EXPLORAR LOJA
            </a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding: 24px 40px; border-top: 1px solid #e5e5e5; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #999;">Obrigado por se cadastrar na Quadros Store.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return {
    subject: "Bem-vindo à Quadros Store!",
    html,
  }
}
