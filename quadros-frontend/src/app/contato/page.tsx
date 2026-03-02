"use client"

import { FormEvent, useState } from "react"
import { Mail, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ContactPage() {
  const [sent, setSent] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-serif text-4xl text-[#1a1a1a]">Contato</h1>
      <p className="mt-4 text-[#1a1a1a]/60">
        Entre em contato conosco. Ficaremos felizes em ajudar!
      </p>

      <div className="mt-10 grid gap-12 lg:grid-cols-2">
        {/* Contact Form */}
        <div>
          {sent ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-6">
              <p className="font-medium text-green-800">
                Mensagem enviada com sucesso!
              </p>
              <p className="mt-2 text-sm text-green-700">
                Responderemos em ate 24 horas uteis.
              </p>
              <Button
                onClick={() => setSent(false)}
                variant="outline"
                className="mt-4"
              >
                Enviar outra mensagem
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
                  Nome
                </label>
                <Input
                  required
                  placeholder="Seu nome"
                  className="border-[#e5e5e5]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
                  Email
                </label>
                <Input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  className="border-[#e5e5e5]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">
                  Mensagem
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Como podemos ajudar?"
                  className="w-full rounded-md border border-[#e5e5e5] bg-white px-3 py-2 text-sm placeholder:text-[#1a1a1a]/40 focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
                />
              </div>
              <Button
                type="submit"
                className="bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90"
              >
                Enviar mensagem
              </Button>
            </form>
          )}
        </div>

        {/* Contact Info */}
        <div className="space-y-8">
          <div className="flex gap-4">
            <Mail className="size-5 shrink-0 text-[#1a1a1a]/60" />
            <div>
              <h3 className="font-medium text-[#1a1a1a]">Email</h3>
              <p className="mt-1 text-sm text-[#1a1a1a]/60">
                contato@quadrosstore.com.br
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Clock className="size-5 shrink-0 text-[#1a1a1a]/60" />
            <div>
              <h3 className="font-medium text-[#1a1a1a]">
                Horario de Atendimento
              </h3>
              <p className="mt-1 text-sm text-[#1a1a1a]/60">
                Segunda a sexta, das 9h as 18h
              </p>
              <p className="text-sm text-[#1a1a1a]/60">
                Sabados, das 9h as 13h
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
