import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import { Resend } from "resend"
import { orderPlacedTemplate } from "./templates/order-placed"
import { orderShippedTemplate } from "./templates/order-shipped"
import { welcomeTemplate } from "./templates/welcome"
import { passwordResetTemplate } from "./templates/password-reset"
import type { ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from "@medusajs/framework/types"

type ResendOptions = {
  api_key: string
  from_email: string
  channels: string[]
}

const templates: Record<string, (data: Record<string, unknown>) => { subject: string; html: string }> = {
  "order-placed": orderPlacedTemplate,
  "order-shipped": orderShippedTemplate,
  welcome: welcomeTemplate,
  "password-reset": passwordResetTemplate,
}

class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "resend"
  private resend: Resend
  private fromEmail: string

  constructor(container: Record<string, unknown>, options: ResendOptions) {
    super()
    this.resend = new Resend(options.api_key)
    this.fromEmail = options.from_email || "onboarding@resend.dev"
  }

  async send(notification: ProviderSendNotificationDTO): Promise<ProviderSendNotificationResultsDTO> {
    const { to, template, data } = notification
    const templateData = data as Record<string, unknown>
    const templateFn = templates[template]

    if (!templateFn) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Email template "${template}" not found`
      )
    }

    const fromName = (templateData.from_name as string) || "Quadros Store"
    const fromEmail = (templateData.from_email as string) || this.fromEmail

    const { subject, html } = templateFn(templateData)

    const { error } = await this.resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      html,
    })

    if (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to send email: ${error.message}`
      )
    }

    return { id: `resend-${Date.now()}` }
  }
}

export default ResendNotificationProviderService
