import ResendNotificationProviderService from "./service"
import { Module } from "@medusajs/framework/utils"

export default Module("resend", {
  service: ResendNotificationProviderService,
})
