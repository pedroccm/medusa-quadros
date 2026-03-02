"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Truck } from "lucide-react"
import { toast } from "sonner"
import { useCart } from "@/context/CartContext"
import { formatPrice, createPayment, calculateShipping } from "@/lib/medusa"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { PaymentMethodSelector } from "@/components/checkout/PaymentMethodSelector"
import { CreditCardForm } from "@/components/checkout/CreditCardForm"
import { PixPayment } from "@/components/checkout/PixPayment"
import { BoletoPayment } from "@/components/checkout/BoletoPayment"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ViaCEPResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

interface ShippingOption {
  id: string
  name: string
  company: string
  price: number
  delivery_min: number
  delivery_max: number
}

type PaymentMethod = "pix" | "credit_card" | "bolbradesco"
type PaymentStep = "form" | "awaiting_pix" | "awaiting_boleto"

interface FormData {
  nome: string
  email: string
  telefone: string
  cpf: string
  cep: string
  rua: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  shippingOptionId: string
  paymentMethod: PaymentMethod
}

interface CardTokenData {
  token: string
  installments: number
  payment_method_id: string
  issuer_id: string
}

// ---------------------------------------------------------------------------
// Masks
// ---------------------------------------------------------------------------

function maskCEP(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, isLoading: cartLoading, refreshCart } = useCart()
  const items = cart?.items ?? []
  const isEmpty = items.length === 0
  const subtotal = cart?.subtotal ?? 0

  const [form, setForm] = useState<FormData>({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    shippingOptionId: "",
    paymentMethod: "pix",
  })

  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError] = useState("")
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [shippingLoading, setShippingLoading] = useState(false)
  const [shippingError, setShippingError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Payment states
  const [paymentStep, setPaymentStep] = useState<PaymentStep>("form")
  const [pixData, setPixData] = useState<{
    paymentId: string
    qrCode: string
    qrCodeBase64: string
  } | null>(null)
  const [boletoData, setBoletoData] = useState<{
    barcode: string
    ticketUrl: string
  } | null>(null)
  const [cardTokenData, setCardTokenData] = useState<CardTokenData | null>(null)
  const cardFormRef = useRef<{ submit: () => void } | null>(null)

  const selectedShipping = shippingOptions.find(
    (o) => o.id === form.shippingOptionId
  )
  const shippingPrice = selectedShipping?.price ?? 0
  const total = subtotal + shippingPrice

  // ------- Field handlers -------

  const updateField = useCallback(
    (field: keyof FormData, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  // ------- CEP lookup -------

  const fetchShippingOptions = useCallback(async (cep: string) => {
    setShippingLoading(true)
    setShippingError("")
    setShippingOptions([])
    setForm((prev) => ({ ...prev, shippingOptionId: "" }))

    try {
      const shippingItems = items.map((item) => ({
        quantity: item.quantity,
        variant_title: item.variant?.title || item.title || "",
      }))

      const data = await calculateShipping(cep, shippingItems)
      const options: ShippingOption[] = data.shipping_options

      setShippingOptions(options)
      if (options.length > 0) {
        setForm((prev) => ({ ...prev, shippingOptionId: options[0].id }))
      }
    } catch {
      setShippingError("Erro ao calcular frete. Tente novamente.")
    } finally {
      setShippingLoading(false)
    }
  }, [items])

  const fetchCEP = useCallback(async (cep: string) => {
    const digits = cep.replace(/\D/g, "")
    if (digits.length !== 8) return

    setCepLoading(true)
    setCepError("")

    try {
      const res = await fetch(`/api/cep/${digits}`)
      const data: ViaCEPResponse = await res.json()

      if (data.erro) {
        setCepError("CEP nao encontrado. Preencha o endereco manualmente.")
      } else {
        setForm((prev) => ({
          ...prev,
          rua: data.logradouro || prev.rua,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
          shippingOptionId: "",
        }))
      }
    } catch {
      setCepError("Nao foi possivel buscar o CEP. Preencha o endereco manualmente.")
    } finally {
      setCepLoading(false)
    }

    // Always calculate shipping if we have a valid CEP
    fetchShippingOptions(digits)
  }, [fetchShippingOptions])

  // ------- Validation -------

  const isFormValid = useMemo(() => {
    return (
      form.nome.trim().length > 0 &&
      form.email.trim().length > 0 &&
      form.telefone.replace(/\D/g, "").length >= 10 &&
      form.cpf.replace(/\D/g, "").length === 11 &&
      form.cep.replace(/\D/g, "").length === 8 &&
      form.rua.trim().length > 0 &&
      form.numero.trim().length > 0 &&
      form.bairro.trim().length > 0 &&
      form.cidade.trim().length > 0 &&
      form.estado.trim().length > 0 &&
      form.shippingOptionId.length > 0
    )
  }, [form])

  // ------- Build payer data -------

  const buildPayerData = useCallback(() => {
    const nameParts = form.nome.trim().split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || firstName
    return {
      email: form.email,
      first_name: firstName,
      last_name: lastName,
      identification: {
        type: "CPF",
        number: form.cpf.replace(/\D/g, ""),
      },
    }
  }, [form.nome, form.email, form.cpf])

  // ------- Submit -------

  const handleSubmit = useCallback(async () => {
    if (!isFormValid) {
      toast.error("Preencha todos os campos obrigatorios.")
      return
    }

    if (!cart?.id) {
      toast.error("Carrinho nao encontrado.")
      return
    }

    // For credit card, we need the token first
    if (form.paymentMethod === "credit_card" && !cardTokenData) {
      // Trigger the card form submission via the MercadoPago SDK
      const cardForm = document.getElementById("mp-card-form") as HTMLFormElement
      if (cardForm) {
        cardForm.requestSubmit()
      } else {
        toast.error("Preencha os dados do cartao.")
      }
      return
    }

    setSubmitting(true)

    try {
      const paymentData: any = {
        cart_id: cart.id,
        payment_method: form.paymentMethod,
        payer: buildPayerData(),
        total: Math.round(total * 100) / 100,
        phone: form.telefone,
        address: {
          street_name: form.rua,
          street_number: form.numero,
          zip_code: form.cep.replace(/\D/g, ""),
          city: form.cidade,
          state: form.estado,
          neighborhood: form.bairro,
        },
      }

      if (form.paymentMethod === "credit_card" && cardTokenData) {
        paymentData.token = cardTokenData.token
        paymentData.installments = cardTokenData.installments
        paymentData.payment_method_id = cardTokenData.payment_method_id
        paymentData.issuer_id = cardTokenData.issuer_id
      }

      const result = await createPayment(paymentData)

      if (form.paymentMethod === "pix") {
        setPixData({
          paymentId: String(result.payment_id),
          qrCode: result.qr_code || "",
          qrCodeBase64: result.qr_code_base64 || "",
        })
        setPaymentStep("awaiting_pix")
      } else if (form.paymentMethod === "bolbradesco") {
        setBoletoData({
          barcode: result.barcode || "",
          ticketUrl: result.ticket_url || "",
        })
        setPaymentStep("awaiting_boleto")
      } else if (form.paymentMethod === "credit_card") {
        if (result.status === "approved") {
          localStorage.removeItem("quadros_cart_id")
          refreshCart()
          router.push("/pedido-confirmado?method=card")
        } else if (result.three_ds_url) {
          // 3D Secure challenge - redirect user to bank verification
          window.location.href = result.three_ds_url
        } else if (result.status === "in_process") {
          localStorage.removeItem("quadros_cart_id")
          refreshCart()
          router.push("/pedido-confirmado?method=card&pending=true")
        } else {
          setCardTokenData(null)
          toast.error(
            `Pagamento ${result.status === "rejected" ? "recusado" : "nao aprovado"}. Tente novamente.`
          )
        }
      }
    } catch (error: any) {
      console.error("Payment error:", error)
      setCardTokenData(null)
      toast.error(error?.message || "Erro ao processar pagamento. Tente novamente.")
    } finally {
      setSubmitting(false)
    }
  }, [isFormValid, cart?.id, form.paymentMethod, cardTokenData, buildPayerData, total, refreshCart, router])

  // Handle card token generated (from CreditCardForm)
  const handleCardToken = useCallback(
    (data: CardTokenData) => {
      setCardTokenData(data)
    },
    []
  )

  // Auto-submit when card token is generated
  useEffect(() => {
    if (cardTokenData && form.paymentMethod === "credit_card") {
      handleSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardTokenData])

  const handleCardError = useCallback((message: string) => {
    toast.error(message)
  }, [])

  const handlePixConfirmed = useCallback(() => {
    localStorage.removeItem("quadros_cart_id")
    refreshCart()
    router.push("/pedido-confirmado?method=pix")
  }, [refreshCart, router])

  // ------- Render -------

  if (isEmpty && !cartLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-6">
          <p className="text-lg text-[#1a1a1a]/50">
            Seu carrinho esta vazio. Adicione produtos antes de finalizar a compra.
          </p>
          <Button
            asChild
            className="bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90"
          >
            <Link href="/loja">Explorar produtos</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Awaiting async payment (Pix or Boleto)
  if (paymentStep === "awaiting_pix" && pixData) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        <h1 className="text-center font-serif text-2xl text-[#1a1a1a]">
          Pagamento via Pix
        </h1>
        <div className="mt-6 rounded-lg border border-[#e5e5e5] bg-white p-6">
          <PixPayment
            paymentId={pixData.paymentId}
            qrCode={pixData.qrCode}
            qrCodeBase64={pixData.qrCodeBase64}
            onConfirmed={handlePixConfirmed}
          />
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-[#1a1a1a]/50">
            Total: <strong>{formatPrice(total)}</strong>
          </p>
        </div>
      </div>
    )
  }

  if (paymentStep === "awaiting_boleto" && boletoData) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        <h1 className="text-center font-serif text-2xl text-[#1a1a1a]">
          Pagamento via Boleto
        </h1>
        <div className="mt-6 rounded-lg border border-[#e5e5e5] bg-white p-6">
          <BoletoPayment
            barcode={boletoData.barcode}
            ticketUrl={boletoData.ticketUrl}
          />
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-[#1a1a1a]/50">
            Total: <strong>{formatPrice(total)}</strong>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/carrinho"
        className="inline-flex items-center gap-2 text-sm text-[#1a1a1a]/60 transition-colors hover:text-[#1a1a1a]"
      >
        <ArrowLeft className="size-4" />
        Voltar ao carrinho
      </Link>

      <h1 className="mt-4 font-serif text-3xl text-[#1a1a1a]">Checkout</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-5">
        {/* ============================================================ */}
        {/* LEFT COLUMN - Form (3/5 = 60%) */}
        {/* ============================================================ */}
        <div className="space-y-10 lg:col-span-3">
          {/* ------- Section 1: Dados Pessoais ------- */}
          <section>
            <h2 className="font-serif text-lg text-[#1a1a1a]">
              Dados Pessoais
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
                  Nome completo *
                </label>
                <Input
                  value={form.nome}
                  onChange={(e) => updateField("nome", e.target.value)}
                  placeholder="Seu nome completo"
                  className="border-[#e5e5e5]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
                  Email *
                </label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="seu@email.com"
                  className="border-[#e5e5e5]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
                  Telefone *
                </label>
                <Input
                  type="tel"
                  value={form.telefone}
                  onChange={(e) =>
                    updateField("telefone", maskPhone(e.target.value))
                  }
                  placeholder="(11) 99999-9999"
                  className="border-[#e5e5e5]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
                  CPF *
                </label>
                <Input
                  value={form.cpf}
                  onChange={(e) =>
                    updateField("cpf", maskCPF(e.target.value))
                  }
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="border-[#e5e5e5]"
                />
              </div>
            </div>
          </section>

          <Separator className="bg-[#e5e5e5]" />

          {/* ------- Section 2: Endereco ------- */}
          <section>
            <h2 className="font-serif text-lg text-[#1a1a1a]">Endereco</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {/* CEP */}
              <div>
                <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
                  CEP *
                </label>
                <div className="relative">
                  <Input
                    value={form.cep}
                    onChange={(e) =>
                      updateField("cep", maskCEP(e.target.value))
                    }
                    onBlur={() => fetchCEP(form.cep)}
                    placeholder="00000-000"
                    maxLength={9}
                    className="border-[#e5e5e5]"
                  />
                  {cepLoading && (
                    <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-[#1a1a1a]/40" />
                  )}
                </div>
                {cepError && (
                  <p className="mt-1 text-xs text-red-600">{cepError}</p>
                )}
              </div>

              {/* Spacer on desktop */}
              <div className="hidden sm:block" />

              {/* Rua */}
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
                  Rua *
                </label>
                <Input
                  value={form.rua}
                  onChange={(e) => updateField("rua", e.target.value)}
                  placeholder="Rua, Avenida..."
                  className="border-[#e5e5e5]"
                />
              </div>

              {/* Numero */}
              <div>
                <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
                  Numero *
                </label>
                <Input
                  value={form.numero}
                  onChange={(e) => updateField("numero", e.target.value)}
                  placeholder="123"
                  className="border-[#e5e5e5]"
                />
              </div>

              {/* Complemento */}
              <div>
                <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
                  Complemento
                </label>
                <Input
                  value={form.complemento}
                  onChange={(e) => updateField("complemento", e.target.value)}
                  placeholder="Apto, Bloco..."
                  className="border-[#e5e5e5]"
                />
              </div>

              {/* Bairro */}
              <div>
                <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
                  Bairro *
                </label>
                <Input
                  value={form.bairro}
                  onChange={(e) => updateField("bairro", e.target.value)}
                  placeholder="Bairro"
                  className="border-[#e5e5e5]"
                />
              </div>

              {/* Cidade */}
              <div>
                <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
                  Cidade *
                </label>
                <Input
                  value={form.cidade}
                  onChange={(e) => updateField("cidade", e.target.value)}
                  placeholder="Cidade"
                  className="border-[#e5e5e5]"
                />
              </div>

              {/* Estado */}
              <div>
                <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
                  Estado *
                </label>
                <Input
                  value={form.estado}
                  onChange={(e) => updateField("estado", e.target.value)}
                  placeholder="UF"
                  maxLength={2}
                  className="border-[#e5e5e5]"
                />
              </div>
            </div>
          </section>

          <Separator className="bg-[#e5e5e5]" />

          {/* ------- Section 3: Frete ------- */}
          <section>
            <h2 className="font-serif text-lg text-[#1a1a1a]">Frete</h2>

            {shippingLoading ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-[#1a1a1a]/60">
                <Loader2 className="size-4 animate-spin" />
                Calculando frete...
              </div>
            ) : shippingError ? (
              <p className="mt-4 text-sm text-red-600">{shippingError}</p>
            ) : shippingOptions.length === 0 ? (
              <p className="mt-4 text-sm text-[#1a1a1a]/50">
                Informe o CEP para calcular o frete.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {shippingOptions.map((option) => (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${
                      form.shippingOptionId === option.id
                        ? "border-[#1a1a1a] bg-[#1a1a1a]/5"
                        : "border-[#e5e5e5] hover:border-[#1a1a1a]/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      value={option.id}
                      checked={form.shippingOptionId === option.id}
                      onChange={() =>
                        updateField("shippingOptionId", option.id)
                      }
                      className="size-4 accent-[#1a1a1a]"
                    />
                    <Truck className="size-5 shrink-0 text-[#1a1a1a]/60" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#1a1a1a]">
                        {option.name} - {option.company}
                      </p>
                      <p className="text-xs text-[#1a1a1a]/50">
                        {option.delivery_min === option.delivery_max
                          ? `${option.delivery_min} dias uteis`
                          : `${option.delivery_min}-${option.delivery_max} dias uteis`}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-[#1a1a1a]">
                      {formatPrice(option.price)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </section>

          <Separator className="bg-[#e5e5e5]" />

          {/* ------- Section 4: Pagamento ------- */}
          <section>
            <h2 className="font-serif text-lg text-[#1a1a1a]">Pagamento</h2>
            <div className="mt-4">
              <PaymentMethodSelector
                selected={form.paymentMethod}
                onChange={(method) => {
                  updateField("paymentMethod", method)
                  setCardTokenData(null)
                }}
              />

              {form.paymentMethod === "credit_card" && total > 0 && (
                <CreditCardForm
                  amount={total}
                  cpf={form.cpf}
                  onTokenGenerated={handleCardToken}
                  onError={handleCardError}
                />
              )}
            </div>
          </section>

          {/* ------- Confirm button (mobile) ------- */}
          <div className="lg:hidden">
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || submitting}
              className="w-full bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Processando pagamento...
                </>
              ) : (
                `Pagar ${formatPrice(total)}`
              )}
            </Button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN - Order Summary (2/5 = 40%) */}
        {/* ============================================================ */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-lg border border-[#e5e5e5] bg-white p-6">
            <h2 className="font-serif text-lg text-[#1a1a1a]">
              Resumo do Pedido
            </h2>

            {/* Items list */}
            <div className="mt-4 max-h-72 space-y-4 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded border border-[#e5e5e5] bg-[#fafafa]">
                    {item.thumbnail ? (
                      <Image
                        src={item.thumbnail}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-[10px] text-[#1a1a1a]/30">
                        Sem img
                      </div>
                    )}
                    {/* Quantity badge */}
                    <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[#1a1a1a] text-[10px] text-white">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex flex-1 items-center justify-between min-w-0">
                    <p className="text-sm text-[#1a1a1a] truncate pr-2">
                      {item.title}
                    </p>
                    <span className="shrink-0 text-sm text-[#1a1a1a]">
                      {formatPrice(item.unit_price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4 bg-[#e5e5e5]" />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#1a1a1a]/60">Subtotal</span>
                <span className="text-[#1a1a1a]">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#1a1a1a]/60">Frete</span>
                <span className="text-[#1a1a1a]">
                  {shippingLoading
                    ? "Calculando..."
                    : shippingOptions.length === 0
                      ? "Informe o CEP"
                      : formatPrice(shippingPrice)}
                </span>
              </div>
            </div>

            <Separator className="my-4 bg-[#e5e5e5]" />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#1a1a1a]">
                Total
              </span>
              <span className="text-lg font-medium text-[#1a1a1a]">
                {formatPrice(total)}
              </span>
            </div>

            {/* Confirm button (desktop) */}
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || submitting}
              className="mt-6 hidden w-full bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90 lg:flex"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Processando pagamento...
                </>
              ) : (
                `Pagar ${formatPrice(total)}`
              )}
            </Button>
          </div>
        </div>
      </div>

    </div>
  )
}
