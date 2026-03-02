"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Check, Copy, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getPaymentStatus } from "@/lib/medusa"

interface PixPaymentProps {
  paymentId: string
  qrCode: string
  qrCodeBase64: string
  onConfirmed: () => void
}

export function PixPayment({
  paymentId,
  qrCode,
  qrCodeBase64,
  onConfirmed,
}: PixPaymentProps) {
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30 * 60) // 30 minutes
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(qrCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const textarea = document.createElement("textarea")
      textarea.value = qrCode
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [qrCode])

  // Polling for payment status
  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      try {
        const result = await getPaymentStatus(paymentId)
        if (result.status === "approved") {
          onConfirmed()
        }
      } catch {
        // ignore polling errors
      }
    }, 5000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [paymentId, onConfirmed])

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  if (timeLeft <= 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <Clock className="size-12 text-red-400" />
        <p className="mt-4 text-lg font-medium text-[#1a1a1a]">
          Pix expirado
        </p>
        <p className="mt-2 text-sm text-[#1a1a1a]/60">
          O tempo para pagamento expirou. Tente novamente.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center py-4">
      <div className="flex items-center gap-2 text-sm text-[#1a1a1a]/60">
        <Clock className="size-4" />
        <span>
          Expira em {String(minutes).padStart(2, "0")}:
          {String(seconds).padStart(2, "0")}
        </span>
      </div>

      {qrCodeBase64 ? (
        <div className="mt-4 rounded-lg border border-[#e5e5e5] bg-white p-4">
          <img
            src={`data:image/png;base64,${qrCodeBase64}`}
            alt="QR Code Pix"
            className="size-48"
          />
        </div>
      ) : (
        <div className="mt-4 flex size-48 items-center justify-center rounded-lg border border-[#e5e5e5] bg-white">
          <Loader2 className="size-8 animate-spin text-[#1a1a1a]/30" />
        </div>
      )}

      <p className="mt-4 text-sm font-medium text-[#1a1a1a]">
        Escaneie o QR Code ou copie o codigo
      </p>

      <div className="mt-3 w-full max-w-sm">
        <div className="rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-3">
          <p className="break-all text-xs text-[#1a1a1a]/70 font-mono">
            {qrCode.substring(0, 80)}...
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
              Copiar codigo Pix
            </>
          )}
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Loader2 className="size-4 animate-spin text-[#1a1a1a]/40" />
        <span className="text-xs text-[#1a1a1a]/50">
          Aguardando pagamento...
        </span>
      </div>
    </div>
  )
}
