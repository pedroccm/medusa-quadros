"use client"

import { useState, useCallback } from "react"
import { Check, Copy, ExternalLink, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BoletoPaymentProps {
  barcode: string
  ticketUrl: string
}

export function BoletoPayment({ barcode, ticketUrl }: BoletoPaymentProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(barcode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = barcode
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [barcode])

  return (
    <div className="flex flex-col items-center py-4">
      <div className="flex size-16 items-center justify-center rounded-full bg-[#1a1a1a]/5">
        <FileText className="size-8 text-[#1a1a1a]/60" />
      </div>

      <p className="mt-4 text-lg font-medium text-[#1a1a1a]">
        Boleto gerado com sucesso
      </p>

      {barcode && (
        <div className="mt-4 w-full max-w-sm">
          <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
            Codigo de barras
          </label>
          <div className="rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-3">
            <p className="break-all text-xs text-[#1a1a1a]/70 font-mono">
              {barcode}
            </p>
          </div>
          <Button
            onClick={handleCopy}
            variant="outline"
            className="mt-2 w-full"
          >
            {copied ? (
              <>
                <Check className="mr-2 size-4 text-green-600" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="mr-2 size-4" />
                Copiar codigo de barras
              </>
            )}
          </Button>
        </div>
      )}

      {ticketUrl && (
        <Button
          asChild
          className="mt-4 w-full max-w-sm bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90"
        >
          <a href={ticketUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 size-4" />
            Abrir boleto (PDF)
          </a>
        </Button>
      )}

      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
        <p className="text-sm text-amber-800">
          O pagamento por boleto pode levar ate 2 dias uteis para ser confirmado.
        </p>
      </div>
    </div>
  )
}
