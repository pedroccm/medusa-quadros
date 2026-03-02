"use client"

import { useEffect, useRef, useState } from "react"
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
  onTokenGenerated: (data: CardTokenData) => void
  onError: (message: string) => void
}

export function CreditCardForm({
  amount,
  onTokenGenerated,
  onError,
}: CreditCardFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const cardFormRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [initError, setInitError] = useState(false)
  const [installmentOptions, setInstallmentOptions] = useState<
    { label: string; value: number }[]
  >([])
  const [selectedInstallments, setSelectedInstallments] = useState(1)
  const initialized = useRef(false)
  const onTokenRef = useRef(onTokenGenerated)
  const onErrorRef = useRef(onError)

  // Keep refs in sync without triggering re-init
  useEffect(() => {
    onTokenRef.current = onTokenGenerated
    onErrorRef.current = onError
  }, [onTokenGenerated, onError])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    let retries = 0
    const maxRetries = 10

    const initCardForm = () => {
      if (!window.MercadoPago) {
        retries++
        if (retries < maxRetries) {
          setTimeout(initCardForm, 500)
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
        const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" })

        const fieldStyle = {
          fontSize: "14px",
          fontFamily: "Inter, sans-serif",
          color: "#1a1a1a",
          "placeholder-color": "rgba(26, 26, 26, 0.5)",
          padding: "0 12px",
        }

        cardFormRef.current = mp.cardForm({
          amount: String(amount),
          iframe: true,
          form: {
            id: "mp-card-form",
            cardNumber: {
              id: "mp-card-number",
              placeholder: "Numero do cartao",
              style: fieldStyle,
            },
            expirationDate: {
              id: "mp-expiration-date",
              placeholder: "MM/AA",
              style: fieldStyle,
            },
            securityCode: {
              id: "mp-security-code",
              placeholder: "CVV",
              style: fieldStyle,
            },
            cardholderName: {
              id: "mp-cardholder-name",
              placeholder: "Nome no cartao",
            },
            installments: {
              id: "mp-installments",
              placeholder: "Parcelas",
            },
          },
          callbacks: {
            onFormMounted: (error: any) => {
              if (error) {
                console.error("CardForm mount error:", error)
                setInitError(true)
              }
              setLoading(false)
            },
            onInstallmentsReceived: (error: any, installments: any) => {
              if (error) return
              if (installments?.payer_costs) {
                const options = installments.payer_costs.map((cost: any) => ({
                  label: cost.recommended_message,
                  value: cost.installments,
                }))
                setInstallmentOptions(options)
              }
            },
            onSubmit: (event: any) => {
              event.preventDefault()
              const cardFormData = cardFormRef.current?.getCardFormData()
              if (!cardFormData?.token) {
                onErrorRef.current("Erro ao processar cartao. Verifique os dados.")
                return
              }
              onTokenRef.current({
                token: cardFormData.token,
                installments: selectedInstallments,
                payment_method_id: cardFormData.paymentMethodId,
                issuer_id: cardFormData.issuerId,
              })
            },
            onError: (error: any) => {
              console.error("CardForm error:", error)
            },
          },
        })
      } catch (err: any) {
        console.error("MP init error:", err)
        setInitError(true)
        setLoading(false)
      }
    }

    initCardForm()

    return () => {
      if (cardFormRef.current) {
        try {
          cardFormRef.current.unmount()
        } catch {
          // ignore unmount errors
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (cardFormRef.current) {
      cardFormRef.current.submit()
    }
  }

  if (initError) {
    return (
      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">
          Nao foi possivel carregar o formulario de cartao. Tente recarregar a pagina ou use outro metodo de pagamento.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-[#1a1a1a]/40" />
          <span className="ml-2 text-sm text-[#1a1a1a]/50">
            Carregando formulario...
          </span>
        </div>
      )}
      <form
        id="mp-card-form"
        ref={formRef}
        onSubmit={handleSubmit}
        className={loading ? "hidden" : "space-y-4"}
      >
        <div>
          <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
            Numero do cartao *
          </label>
          <div
            id="mp-card-number"
            className="mp-iframe-container h-10 rounded-md border border-[#e5e5e5]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
              Validade *
            </label>
            <div
              id="mp-expiration-date"
              className="mp-iframe-container h-10 rounded-md border border-[#e5e5e5]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
              CVV *
            </label>
            <div
              id="mp-security-code"
              className="mp-iframe-container h-10 rounded-md border border-[#e5e5e5]"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
            Nome no cartao *
          </label>
          <input
            id="mp-cardholder-name"
            type="text"
            className="h-10 w-full rounded-md border border-[#e5e5e5] px-3 text-sm text-[#1a1a1a] placeholder:text-[#1a1a1a]/50 focus:border-[#1a1a1a] focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
            Parcelas *
          </label>
          {installmentOptions.length > 0 ? (
            <select
              id="mp-installments"
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
              id="mp-installments"
              className="h-10 w-full rounded-md border border-[#e5e5e5] px-3 text-sm text-[#1a1a1a] focus:border-[#1a1a1a] focus:outline-none"
            >
              <option value="1">1x sem juros</option>
            </select>
          )}
        </div>
      </form>
    </div>
  )
}
