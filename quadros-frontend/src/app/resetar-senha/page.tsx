"use client"

import { FormEvent, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { resetPassword } from "@/lib/medusa"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const email = searchParams.get("email") || ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.")
      return
    }

    if (password !== confirmPassword) {
      setError("As senhas nao coincidem.")
      return
    }

    if (!token || !email) {
      setError("Link invalido. Solicite um novo link de recuperacao.")
      return
    }

    setLoading(true)
    try {
      await resetPassword(email, token, password)
      setSuccess(true)
      setTimeout(() => router.push("/login"), 3000)
    } catch {
      setError("Nao foi possivel redefinir a senha. O link pode ter expirado.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
          <p className="font-medium text-green-800">Senha redefinida!</p>
          <p className="mt-2 text-sm text-green-700">
            Sua senha foi alterada com sucesso. Voce sera redirecionado para o
            login em instantes...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-serif text-3xl text-[#1a1a1a]">Redefinir Senha</h1>
      <p className="mt-4 text-sm text-[#1a1a1a]/60">
        Digite sua nova senha abaixo.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
            Nova senha
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimo 8 caracteres"
            required
            className="border-[#e5e5e5]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
            Confirmar nova senha
          </label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a senha"
            required
            className="border-[#e5e5e5]"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Redefinindo...
            </>
          ) : (
            "Redefinir senha"
          )}
        </Button>
      </form>
    </div>
  )
}
