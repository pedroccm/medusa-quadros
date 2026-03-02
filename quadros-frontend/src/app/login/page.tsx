"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated } = useAuth()

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
    setLoading(true)

    try {
      await login(email, password)
      router.push("/conta")
    } catch {
      setError("Email ou senha incorretos. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-serif text-3xl text-[#1a1a1a]">Entrar</h1>

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

        <div>
          <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
            Senha
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            required
            className="border-[#e5e5e5]"
          />
        </div>

        <div className="flex justify-end">
          <Link
            href="/esqueci-senha"
            className="text-sm text-[#1a1a1a]/60 underline underline-offset-4 transition-colors hover:text-[#1a1a1a]"
          >
            Esqueceu a senha?
          </Link>
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
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#1a1a1a]/60">
        Nao tem conta?{" "}
        <Link
          href="/cadastro"
          className="text-[#1a1a1a] underline underline-offset-4 transition-colors hover:text-[#1a1a1a]/70"
        >
          Cadastre-se
        </Link>
      </p>
    </div>
  )
}
