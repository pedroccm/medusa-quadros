"use client"

import { FormEvent, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ProfileDataPage() {
  const { customer, updateProfile } = useAuth()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)

  // Pre-fill form when customer data is available
  useEffect(() => {
    if (customer) {
      setFirstName(customer.first_name || "")
      setLastName(customer.last_name || "")
      setPhone(customer.phone || "")
    }
  }, [customer])

  if (!customer) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone: phone || undefined,
      })
      toast.success("Dados atualizados com sucesso.")
    } catch {
      toast.error("Erro ao atualizar dados. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="font-serif text-xl text-[#1a1a1a]">Meus Dados</h2>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-lg border border-[#e5e5e5] bg-white p-6"
      >
        <div>
          <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
            Nome
          </label>
          <Input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Seu nome"
            className="border-[#e5e5e5]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
            Sobrenome
          </label>
          <Input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Seu sobrenome"
            className="border-[#e5e5e5]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
            Email
          </label>
          <Input
            type="email"
            value={customer.email}
            disabled
            className="border-[#e5e5e5] bg-[#fafafa]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
            Telefone
          </label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            className="border-[#e5e5e5]"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar"
          )}
        </Button>
      </form>
    </div>
  )
}
