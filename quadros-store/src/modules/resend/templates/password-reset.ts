interface PasswordResetData {
  url?: string
}

export function passwordResetTemplate(data: Record<string, unknown>): {
  subject: string
  html: string
} {
  const { url } = data as unknown as PasswordResetData
  const resetUrl = url || "#"

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
            <h2 style="margin: 0 0 8px; font-size: 22px; color: #1a1a1a; font-weight: 600;">Redefinir Senha</h2>
            <p style="color: #444; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
              Recebemos uma solicitacao para redefinir a senha da sua conta na Quadros Store.
            </p>
            <p style="color: #444; font-size: 15px; line-height: 1.6; margin: 0 0 32px;">
              Clique no botao abaixo para criar uma nova senha. Este link expira em 1 hora.
            </p>
            <a href="${resetUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 32px; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 0.5px;">
              REDEFINIR SENHA
            </a>
            <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 32px 0 0;">
              Se voce nao solicitou a redefinicao de senha, ignore este email. Sua senha permanecera inalterada.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding: 24px 40px; border-top: 1px solid #e5e5e5; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #999;">Quadros Store - Quadros decorativos para transformar seus ambientes.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return {
    subject: "Redefinir sua senha - Quadros Store",
    html,
  }
}
