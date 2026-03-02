"use client"

import { QrCode, CreditCard, FileText } from "lucide-react"

type PaymentMethod = "pix" | "credit_card" | "bolbradesco"

interface PaymentMethodSelectorProps {
  selected: PaymentMethod
  onChange: (method: PaymentMethod) => void
}

const methods = [
  {
    id: "pix" as PaymentMethod,
    label: "Pix",
    description: "Aprovacao instantanea",
    icon: QrCode,
  },
  {
    id: "credit_card" as PaymentMethod,
    label: "Cartao de Credito",
    description: "Ate 12x sem juros",
    icon: CreditCard,
  },
  {
    id: "bolbradesco" as PaymentMethod,
    label: "Boleto",
    description: "Ate 2 dias uteis",
    icon: FileText,
  },
]

export function PaymentMethodSelector({
  selected,
  onChange,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      {methods.map((method) => {
        const Icon = method.icon
        return (
          <label
            key={method.id}
            className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${
              selected === method.id
                ? "border-[#1a1a1a] bg-[#1a1a1a]/5"
                : "border-[#e5e5e5] hover:border-[#1a1a1a]/30"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method.id}
              checked={selected === method.id}
              onChange={() => onChange(method.id)}
              className="size-4 accent-[#1a1a1a]"
            />
            <Icon className="size-5 shrink-0 text-[#1a1a1a]/60" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#1a1a1a]">
                {method.label}
              </p>
              <p className="text-xs text-[#1a1a1a]/50">{method.description}</p>
            </div>
          </label>
        )
      })}
    </div>
  )
}
