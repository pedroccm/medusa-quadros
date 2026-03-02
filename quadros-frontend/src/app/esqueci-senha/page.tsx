"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { Loader2, ArrowLeft } from "lucide-react"
import { requestPasswordReset } from "@/lib/medusa"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await requestPasswordReset(email)
    } catch {
      // Silently ignore - don't reveal if email exists
    } finally {
      setLoading(false)
      setSent(true)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-sm text-[#1a1a1a]/60 transition-colors hover:text-[#1a1a1a]"
      >
        <ArrowLeft className="size-4" />
        Voltar ao login
      </Link>

      <h1 className="mt-6 font-serif text-3xl text-[#1a1a1a]">
        Esqueceu a senha?
      </h1>

      {sent ? (
        <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-6">
          <p className="font-medium text-green-800">Email enviado!</p>
          <p className="mt-2 text-sm text-green-700">
            Se o email informado estiver cadastrado, voce recebera um link para
            redefinir sua senha. Verifique sua caixa de entrada e a pasta de
            spam.
          </p>
          <Button
            onClick={() => setSent(false)}
            variant="outline"
            className="mt-4"
          >
            Tentar outro email
          </Button>
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-[#1a1a1a]/60">
            Informe seu email e enviaremos um link para redefinir sua senha.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="border-[#e5e5e5]"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar link de recuperacao"
              )}
            </Button>
          </form>
        </>
      )}
    </div>
  )
}
