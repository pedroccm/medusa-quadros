"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface CreditCardFormAsaasProps {
  amount: number
  cpf: string
  onSubmit: (data: {
    holder_name: string
    number: string
    expiry_month: string
    expiry_year: string
    security_code: string
    installments: number
  }) => void
  onError: (message: string) => void
  submitting?: boolean
}

function maskCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16)
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ")
}

function maskExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export function CreditCardFormAsaas({
  amount,
  cpf,
  onSubmit,
  onError,
  submitting = false,
}: CreditCardFormAsaasProps) {
  const [cardNumber, setCardNumber] = useState("")
  const [holderName, setHolderName] = useState("")
  const [expiry, setExpiry] = useState("")
  const [securityCode, setSecurityCode] = useState("")
  const [installments, setInstallments] = useState(1)

  // Generate installment options
  const maxInstallments = amount >= 10 ? 12 : amount >= 5 ? 6 : 1
  const installmentOptions = Array.from(
    { length: maxInstallments },
    (_, i) => i + 1
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      const rawNumber = cardNumber.replace(/\s/g, "")
      if (rawNumber.length < 13) {
        onError("Número do cartão inválido.")
        return
      }

      const [expMonth, expYear] = expiry.split("/")
      if (!expMonth || !expYear || expMonth.length < 2 || expYear.length < 2) {
        onError("Validade do cartão inválida.")
        return
      }

      if (securityCode.length < 3) {
        onError("CVV inválido.")
        return
      }

      if (!holderName.trim()) {
        onError("Nome no cartão é obrigatório.")
        return
      }

      if (cpf.replace(/\D/g, "").length !== 11) {
        onError("CPF inválido.")
        return
      }

      onSubmit({
        holder_name: holderName.trim(),
        number: rawNumber,
        expiry_month: expMonth,
        expiry_year: "20" + expYear,
        security_code: securityCode,
        installments,
      })
    },
    [cardNumber, holderName, expiry, securityCode, cpf, installments, onSubmit, onError]
  )

  return (
    <form id="asaas-card-form" onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
          Número do cartão *
        </label>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="cc-number"
          value={cardNumber}
          onChange={(e) => setCardNumber(maskCardNumber(e.target.value))}
          placeholder="0000 0000 0000 0000"
          maxLength={19}
          className="h-10 w-full rounded-md border border-[#e5e5e5] px-3 text-sm text-[#1a1a1a] placeholder:text-[#1a1a1a]/50 focus:border-[#1a1a1a] focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
          Nome no cartão *
        </label>
        <input
          type="text"
          autoComplete="cc-name"
          value={holderName}
          onChange={(e) => setHolderName(e.target.value.toUpperCase())}
          placeholder="NOME COMO NO CARTÃO"
          className="h-10 w-full rounded-md border border-[#e5e5e5] px-3 text-sm text-[#1a1a1a] placeholder:text-[#1a1a1a]/50 focus:border-[#1a1a1a] focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
            Validade *
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp"
            value={expiry}
            onChange={(e) => setExpiry(maskExpiry(e.target.value))}
            placeholder="MM/AA"
            maxLength={5}
            className="h-10 w-full rounded-md border border-[#e5e5e5] px-3 text-center text-sm text-[#1a1a1a] placeholder:text-[#1a1a1a]/50 focus:border-[#1a1a1a] focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
            CVV *
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-csc"
            value={securityCode}
            onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="123"
            maxLength={4}
            className="h-10 w-full rounded-md border border-[#e5e5e5] px-3 text-sm text-[#1a1a1a] placeholder:text-[#1a1a1a]/50 focus:border-[#1a1a1a] focus:outline-none"
          />
        </div>
      </div>

      {amount > 5 && (
        <div>
          <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
            Parcelas *
          </label>
          <select
            value={installments}
            onChange={(e) => setInstallments(Number(e.target.value))}
            className="h-10 w-full rounded-md border border-[#e5e5e5] px-3 text-sm text-[#1a1a1a] focus:border-[#1a1a1a] focus:outline-none"
          >
            {installmentOptions.map((n) => (
              <option key={n} value={n}>
                {n}x {formatPrice(amount / n)}
              </option>
            ))}
          </select>
        </div>
      )}

      {submitting ? (
        <div className="flex items-center gap-2 text-sm text-[#1a1a1a]/60">
          <Loader2 className="size-4 animate-spin" />
          Processando pagamento...
        </div>
      ) : (
        <Button
          type="submit"
          form="asaas-card-form"
          className="w-full bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90"
        >
          Pagar {formatPrice(amount)}
        </Button>
      )}
    </form>
  )
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount)
}
