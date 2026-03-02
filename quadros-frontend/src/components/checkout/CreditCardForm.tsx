"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

declare global {
  interface Window {
    MercadoPago: any
  }
}

interface CardTokenData {
  token: string
  installments: number
  payment_method_id: string
  issuer_id: string
}

interface CreditCardFormProps {
  amount: number
  cpf: string
  onTokenGenerated: (data: CardTokenData) => void
  onError: (message: string) => void
}

function maskCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16)
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ")
}

export function CreditCardForm({
  amount,
  cpf,
  onTokenGenerated,
  onError,
}: CreditCardFormProps) {
  const [loading, setLoading] = useState(true)
  const [initError, setInitError] = useState(false)
  const mpRef = useRef<any>(null)

  const [cardNumber, setCardNumber] = useState("")
  const [cardholderName, setCardholderName] = useState("")
  const [expirationMonth, setExpirationMonth] = useState("")
  const [expirationYear, setExpirationYear] = useState("")
  const [securityCode, setSecurityCode] = useState("")

  const [installmentOptions, setInstallmentOptions] = useState<
    { label: string; value: number }[]
  >([])
  const [selectedInstallments, setSelectedInstallments] = useState(1)
  const [paymentMethodId, setPaymentMethodId] = useState("")
  const [issuerId, setIssuerId] = useState("")

  const [generatingToken, setGeneratingToken] = useState(false)

  // Initialize MercadoPago SDK
  useEffect(() => {
    let retries = 0
    const maxRetries = 20
    let cancelled = false

    const init = () => {
      if (cancelled) return

      if (!window.MercadoPago) {
        retries++
        if (retries < maxRetries) {
          setTimeout(init, 500)
        } else {
          setInitError(true)
          setLoading(false)
        }
        return
      }

      const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
      if (!publicKey) {
        console.error("NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY is not set")
        setInitError(true)
        setLoading(false)
        return
      }

      try {
        mpRef.current = new window.MercadoPago(publicKey, { locale: "pt-BR" })
        setLoading(false)
      } catch (err) {
        console.error("MP init error:", err)
        setInitError(true)
        setLoading(false)
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [])

  // Fetch installments when BIN (first 6 digits) or amount changes
  const prevBinRef = useRef("")
  const prevAmountRef = useRef(0)
  const fetchingInstallmentsRef = useRef(false)
  useEffect(() => {
    const bin = cardNumber.replace(/\s/g, "").slice(0, 6)
    if (bin.length < 6 || !mpRef.current) return
    if (bin === prevBinRef.current && amount === prevAmountRef.current) return
    if (fetchingInstallmentsRef.current) return
    prevBinRef.current = bin
    prevAmountRef.current = amount
    fetchingInstallmentsRef.current = true

    mpRef.current
      .getInstallments({ amount: String(amount), bin })
      .then((result: any) => {
        if (result?.[0]) {
          const data = result[0]
          setPaymentMethodId(data.payment_method_id || "")
          setIssuerId(String(data.issuer?.id || ""))

          const options =
            data.payer_costs?.map((cost: any) => ({
              label: cost.recommended_message,
              value: cost.installments,
            })) || []
          setInstallmentOptions(options)
          if (options.length > 0) {
            setSelectedInstallments(options[0].value)
          }
        }
      })
      .catch(() => {
        // Ignore installment fetch errors
      })
      .finally(() => {
        fetchingInstallmentsRef.current = false
      })
  }, [cardNumber, amount])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!mpRef.current || generatingToken) return

      const rawNumber = cardNumber.replace(/\s/g, "")
      if (rawNumber.length < 13) {
        onError("Numero do cartao invalido.")
        return
      }
      if (!expirationMonth || !expirationYear) {
        onError("Preencha a validade do cartao.")
        return
      }
      if (!securityCode) {
        onError("Preencha o CVV.")
        return
      }
      if (!cardholderName.trim()) {
        onError("Preencha o nome no cartao.")
        return
      }

      setGeneratingToken(true)
      try {
        const tokenData = await mpRef.current.createCardToken({
          cardNumber: rawNumber,
          cardholderName: cardholderName.trim(),
          cardExpirationMonth: expirationMonth.padStart(2, "0"),
          cardExpirationYear: expirationYear.padStart(2, "0"),
          securityCode,
          identificationType: "CPF",
          identificationNumber: cpf.replace(/\D/g, ""),
        })

        if (tokenData?.id) {
          onTokenGenerated({
            token: tokenData.id,
            installments: selectedInstallments,
            payment_method_id: paymentMethodId,
            issuer_id: issuerId,
          })
        } else {
          onError("Erro ao processar cartao. Verifique os dados.")
        }
      } catch (err: any) {
        console.error("Card token error:", err)
        const msg =
          err?.message || "Erro ao processar cartao. Verifique os dados."
        onError(msg)
      } finally {
        setGeneratingToken(false)
      }
    },
    [
      cardNumber,
      cardholderName,
      expirationMonth,
      expirationYear,
      securityCode,
      cpf,
      selectedInstallments,
      paymentMethodId,
      issuerId,
      generatingToken,
      onTokenGenerated,
      onError,
    ]
  )

  if (initError) {
    return (
      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">
          Nao foi possivel carregar o formulario de cartao. Tente recarregar a
          pagina ou use outro metodo de pagamento.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mt-4 flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-[#1a1a1a]/40" />
        <span className="ml-2 text-sm text-[#1a1a1a]/50">
          Carregando formulario...
        </span>
      </div>
    )
  }

  return (
    <form id="mp-card-form" onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
          Numero do cartao *
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
            Validade *
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp-month"
              value={expirationMonth}
              onChange={(e) =>
                setExpirationMonth(
                  e.target.value.replace(/\D/g, "").slice(0, 2)
                )
              }
              placeholder="MM"
              maxLength={2}
              className="h-10 w-full rounded-md border border-[#e5e5e5] px-3 text-center text-sm text-[#1a1a1a] placeholder:text-[#1a1a1a]/50 focus:border-[#1a1a1a] focus:outline-none"
            />
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp-year"
              value={expirationYear}
              onChange={(e) =>
                setExpirationYear(
                  e.target.value.replace(/\D/g, "").slice(0, 2)
                )
              }
              placeholder="AA"
              maxLength={2}
              className="h-10 w-full rounded-md border border-[#e5e5e5] px-3 text-center text-sm text-[#1a1a1a] placeholder:text-[#1a1a1a]/50 focus:border-[#1a1a1a] focus:outline-none"
            />
          </div>
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
            onChange={(e) =>
              setSecurityCode(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="123"
            maxLength={4}
            className="h-10 w-full rounded-md border border-[#e5e5e5] px-3 text-sm text-[#1a1a1a] placeholder:text-[#1a1a1a]/50 focus:border-[#1a1a1a] focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
          Nome no cartao *
        </label>
        <input
          type="text"
          autoComplete="cc-name"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
          placeholder="NOME COMO NO CARTAO"
          className="h-10 w-full rounded-md border border-[#e5e5e5] px-3 text-sm text-[#1a1a1a] placeholder:text-[#1a1a1a]/50 focus:border-[#1a1a1a] focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
          Parcelas *
        </label>
        {installmentOptions.length > 0 ? (
          <select
            value={selectedInstallments}
            onChange={(e) => setSelectedInstallments(Number(e.target.value))}
            className="h-10 w-full rounded-md border border-[#e5e5e5] px-3 text-sm text-[#1a1a1a] focus:border-[#1a1a1a] focus:outline-none"
          >
            {installmentOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <select
            className="h-10 w-full rounded-md border border-[#e5e5e5] px-3 text-sm text-[#1a1a1a] focus:border-[#1a1a1a] focus:outline-none"
            disabled
          >
            <option value="1">
              {cardNumber.replace(/\s/g, "").length >= 6
                ? "Carregando parcelas..."
                : "Digite o numero do cartao"}
            </option>
          </select>
        )}
      </div>

      {generatingToken && (
        <div className="flex items-center gap-2 text-sm text-[#1a1a1a]/60">
          <Loader2 className="size-4 animate-spin" />
          Processando cartao...
        </div>
      )}
    </form>
  )
}
