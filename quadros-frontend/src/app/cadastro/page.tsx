"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function RegisterPage() {
  const router = useRouter()
  const { register, isAuthenticated } = useAuth()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // If already authenticated, redirect
  if (isAuthenticated) {
    router.push("/conta")
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.")
      return
    }

    setLoading(true)

    try {
      await register(email, password, firstName, lastName)
      router.push("/conta")
    } catch {
      setError("Erro ao criar conta. Verifique os dados e tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-serif text-3xl text-[#1a1a1a]">Criar Conta</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
            Nome
          </label>
          <Input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Seu nome"
            required
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
            required
            className="border-[#e5e5e5]"
          />
        </div>

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

        <div>
          <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
            Senha
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimo 8 caracteres"
            required
            minLength={8}
            className="border-[#e5e5e5]"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Criando conta...
            </>
          ) : (
            "Criar Conta"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#1a1a1a]/60">
        Ja tem conta?{" "}
        <Link
          href="/login"
          className="text-[#1a1a1a] underline underline-offset-4 transition-colors hover:text-[#1a1a1a]/70"
        >
          Entrar
        </Link>
      </p>
    </div>
  )
}
