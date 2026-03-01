"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Truck, CreditCard, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { useCart } from "@/context/CartContext"
import { formatPrice } from "@/lib/medusa"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

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
  label: string
  price: number
  estimatedDays: string
}

interface FormData {
  // Dados pessoais
  nome: string
  email: string
  telefone: string
  // Endereco
  cep: string
  rua: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  // Frete
  shippingOptionId: string
}

// ---------------------------------------------------------------------------
// Shipping calculation helpers
// ---------------------------------------------------------------------------

const SP_CAPITAL_CEPS = [
  "01", "02", "03", "04", "05", "06", "07", "08",
]

function isSpCapital(cep: string): boolean {
  const clean = cep.replace(/\D/g, "")
  const prefix = clean.substring(0, 2)
  return clean.startsWith("0") && SP_CAPITAL_CEPS.includes(prefix)
}

function calculateShippingOptions(
  estado: string,
  cep: string,
  subtotal: number
): ShippingOption[] {
  const isFreeShipping = subtotal >= 199

  let basePrice: number
  let estimatedDays: string

  if (estado === "SP" && isSpCapital(cep)) {
    basePrice = 12.9
    estimatedDays = "3-5 dias uteis"
  } else if (estado === "SP") {
    basePrice = 18.9
    estimatedDays = "5-7 dias uteis"
  } else if (["RJ", "MG", "ES"].includes(estado)) {
    basePrice = 22.9
    estimatedDays = "7-10 dias uteis"
  } else {
    basePrice = 29.9
    estimatedDays = "10-15 dias uteis"
  }

  const options: ShippingOption[] = [
    {
      id: "standard",
      label: "Frete Padrao",
      price: isFreeShipping ? 0 : basePrice,
      estimatedDays,
    },
  ]

  return options
}

// ---------------------------------------------------------------------------
// CEP mask
// ---------------------------------------------------------------------------

function maskCEP(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

// ---------------------------------------------------------------------------
// Phone mask (optional convenience)
// ---------------------------------------------------------------------------

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
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
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    shippingOptionId: "",
  })

  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)

  // Derived shipping options based on state
  const shippingOptions = useMemo(() => {
    if (!form.estado) return []
    return calculateShippingOptions(form.estado, form.cep, subtotal)
  }, [form.estado, form.cep, subtotal])

  // Auto-select first shipping option when available
  useEffect(() => {
    if (shippingOptions.length > 0 && !form.shippingOptionId) {
      setForm((prev) => ({
        ...prev,
        shippingOptionId: shippingOptions[0].id,
      }))
    }
  }, [shippingOptions, form.shippingOptionId])

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

  const fetchCEP = useCallback(async (cep: string) => {
    const digits = cep.replace(/\D/g, "")
    if (digits.length !== 8) return

    setCepLoading(true)
    setCepError("")

    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data: ViaCEPResponse = await res.json()

      if (data.erro) {
        setCepError("CEP nao encontrado")
        return
      }

      setForm((prev) => ({
        ...prev,
        rua: data.logradouro || prev.rua,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
        shippingOptionId: "", // reset to recalculate
      }))
    } catch {
      setCepError("Erro ao buscar CEP. Tente novamente.")
    } finally {
      setCepLoading(false)
    }
  }, [])

  // ------- Validation -------

  const isFormValid = useMemo(() => {
    return (
      form.nome.trim().length > 0 &&
      form.email.trim().length > 0 &&
      form.telefone.replace(/\D/g, "").length >= 10 &&
      form.cep.replace(/\D/g, "").length === 8 &&
      form.rua.trim().length > 0 &&
      form.numero.trim().length > 0 &&
      form.bairro.trim().length > 0 &&
      form.cidade.trim().length > 0 &&
      form.estado.trim().length > 0 &&
      form.shippingOptionId.length > 0
    )
  }, [form])

  // ------- Submit -------

  const handleSubmit = useCallback(async () => {
    if (!isFormValid) {
      toast.error("Preencha todos os campos obrigatorios.")
      return
    }

    setSubmitting(true)

    // Simulate order placement (Mercado Pago integration placeholder)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setSubmitting(false)
    setSuccessOpen(true)
  }, [isFormValid])

  const handleSuccessClose = useCallback(() => {
    setSuccessOpen(false)
    // Clear cart from localStorage
    localStorage.removeItem("quadros_cart_id")
    refreshCart()
    router.push("/loja")
  }, [refreshCart, router])

  // ------- Render -------

  if (isEmpty && !cartLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-6">
          <p className="text-lg text-[#1a1a1a]/50">
            Seu carrinho está vazio. Adicione produtos antes de finalizar a compra.
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
                  disabled
                  placeholder="Cidade"
                  className="border-[#e5e5e5] bg-[#fafafa]"
                />
              </div>

              {/* Estado */}
              <div>
                <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
                  Estado *
                </label>
                <Input
                  value={form.estado}
                  disabled
                  placeholder="UF"
                  className="border-[#e5e5e5] bg-[#fafafa]"
                />
              </div>
            </div>
          </section>

          <Separator className="bg-[#e5e5e5]" />

          {/* ------- Section 3: Frete ------- */}
          <section>
            <h2 className="font-serif text-lg text-[#1a1a1a]">Frete</h2>

            {!form.estado ? (
              <p className="mt-4 text-sm text-[#1a1a1a]/50">
                Informe o CEP acima para calcular o frete.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {subtotal >= 199 && (
                  <p className="text-sm font-medium text-green-700">
                    Frete gratis para compras acima de R$ 199,00!
                  </p>
                )}
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
                        {option.label}
                      </p>
                      <p className="text-xs text-[#1a1a1a]/50">
                        Entrega estimada: {option.estimatedDays}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-[#1a1a1a]">
                      {option.price === 0
                        ? "Gratis"
                        : formatPrice(option.price)}
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
            <div className="mt-4 rounded-lg border border-[#e5e5e5] bg-white p-6">
              <div className="flex items-center gap-3">
                <CreditCard className="size-6 text-[#1a1a1a]/60" />
                <div>
                  <p className="text-sm font-medium text-[#1a1a1a]">
                    Pagamento via Mercado Pago
                  </p>
                  <p className="mt-0.5 text-xs text-[#1a1a1a]/50">
                    (Integracao em breve)
                  </p>
                </div>
              </div>
              <Button
                disabled
                className="mt-4 w-full bg-[#009ee3] text-white hover:bg-[#009ee3]/90 disabled:opacity-60"
              >
                Pagar com Mercado Pago
              </Button>
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
                  Processando...
                </>
              ) : (
                "Confirmar Pedido"
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
                      {formatPrice(item.total)}
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
                  {!form.estado
                    ? "Informe o CEP"
                    : shippingPrice === 0
                      ? "Gratis"
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
                  Processando...
                </>
              ) : (
                "Confirmar Pedido"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Success dialog */}
      {/* ============================================================ */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="size-8 text-green-600" />
            </div>
            <DialogTitle className="text-center font-serif text-xl">
              Pedido confirmado!
            </DialogTitle>
            <DialogDescription className="text-center">
              Obrigado pela sua compra. Voce recebera um email com os detalhes
              do pedido em breve.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              onClick={handleSuccessClose}
              className="bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90"
            >
              Voltar para a loja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
