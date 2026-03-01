"use client"

import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"

export default function AccountPage() {
  const { customer } = useAuth()

  if (!customer) return null

  return (
    <div>
      <h2 className="font-serif text-xl text-[#1a1a1a]">Visao Geral</h2>

      <div className="mt-6 rounded-lg border border-[#e5e5e5] bg-white p-6">
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#1a1a1a]/40">
              Nome
            </p>
            <p className="mt-1 text-sm text-[#1a1a1a]">
              {customer.first_name || "-"} {customer.last_name || ""}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-[#1a1a1a]/40">
              Email
            </p>
            <p className="mt-1 text-sm text-[#1a1a1a]">{customer.email}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-[#1a1a1a]/40">
              Telefone
            </p>
            <p className="mt-1 text-sm text-[#1a1a1a]">
              {customer.phone || "-"}
            </p>
          </div>
        </div>

        <Button
          asChild
          variant="outline"
          className="mt-6 border-[#e5e5e5] text-[#1a1a1a] hover:bg-[#1a1a1a]/5"
        >
          <Link href="/conta/dados">Editar dados</Link>
        </Button>
      </div>
    </div>
  )
}
