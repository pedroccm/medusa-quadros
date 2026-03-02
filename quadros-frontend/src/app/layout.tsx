import type { Metadata } from "next"
import Script from "next/script"
import { Playfair_Display, Inter } from "next/font/google"
import { Providers } from "./providers"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { CartDrawer } from "@/components/cart/CartDrawer"
import { Toaster } from "@/components/ui/sonner"
import { CookieConsent } from "@/components/CookieConsent"
import "./globals.css"

const playfairDisplay = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
})

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://quadrosstore.com.br"
  ),
  title: {
    default: "Quadros Store - Quadros Decorativos",
    template: "%s | Quadros Store",
  },
  description:
    "Quadros decorativos para transformar seus ambientes. Arte impressa com qualidade premium.",
  openGraph: {
    title: "Quadros Store - Quadros Decorativos",
    description:
      "Quadros decorativos para transformar seus ambientes. Arte impressa com qualidade premium.",
    type: "website",
    locale: "pt_BR",
    siteName: "Quadros Store",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        strategy="beforeInteractive"
      />
      <body
        className={`${playfairDisplay.variable} ${inter.variable} font-sans bg-[#fafafa] text-[#1a1a1a] antialiased min-h-screen flex flex-col`}
      >
        <Providers>
          <Header />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
          <CartDrawer />
          <Toaster />
          <CookieConsent />
        </Providers>
      </body>
    </html>
  )
}
