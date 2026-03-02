"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Suspense } from "react"

function OrderConfirmedContent() {
  const searchParams = useSearchParams()
  const method = searchParams.get("method")

  const messages: Record<string, string> = {
    pix: "Seu pagamento via Pix foi confirmado com sucesso!",
    card: "Seu pagamento com cartao de credito foi aprovado!",
    boleto:
      "Seu boleto foi gerado. O pagamento sera confirmado em ate 2 dias uteis.",
  }

  const message =
    method && messages[method]
      ? messages[method]
      : "Obrigado pela sua compra. Voce recebera um email com os detalhes do pedido em breve."

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="flex size-20 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 className="size-10 text-green-600" />
      </div>

      <h1 className="mt-6 font-serif text-3xl text-[#1a1a1a]">
        Pedido confirmado!
      </h1>
      <p className="mt-4 max-w-md text-center text-[#1a1a1a]/60">{message}</p>

      <div className="mt-8 flex gap-4">
        <Button asChild variant="outline">
          <Link href="/conta/pedidos">Ver meus pedidos</Link>
        </Button>
        <Button
          asChild
          className="bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90"
        >
          <Link href="/loja">Continuar comprando</Link>
        </Button>
      </div>
    </div>
  )
}

export default function OrderConfirmedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-[#1a1a1a]/20 border-t-[#1a1a1a]" />
        </div>
      }
    >
      <OrderConfirmedContent />
    </Suspense>
  )
}
