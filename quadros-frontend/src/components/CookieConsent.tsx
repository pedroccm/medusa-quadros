"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "quadros_cookie_consent"

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY)
    if (!consent) setVisible(true)
  }, [])

  function handleAccept() {
    localStorage.setItem(STORAGE_KEY, "accepted")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#e5e5e5] bg-white p-4 shadow-lg">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-sm text-[#1a1a1a]/70">
          Usamos cookies para melhorar sua experiencia. Ao continuar
          navegando, voce concorda com nossa{" "}
          <Link
            href="/privacidade"
            className="underline underline-offset-4 hover:text-[#1a1a1a]"
          >
            Politica de Privacidade
          </Link>{" "}
          e{" "}
          <Link
            href="/termos"
            className="underline underline-offset-4 hover:text-[#1a1a1a]"
          >
            Termos de Uso
          </Link>
          .
        </p>
        <Button
          onClick={handleAccept}
          className="shrink-0 bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90"
        >
          Aceitar
        </Button>
      </div>
    </div>
  )
}
