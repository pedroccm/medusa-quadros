"use client"

import { useState, useEffect } from "react"
import { Mail, Send, Loader2, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import {
  loginAdmin,
  getEmailSettings,
  updateEmailSettings,
  sendTestEmail,
  type EmailSettings,
} from "@/lib/medusa"

const EMAIL_TYPES = [
  {
    key: "order_placed" as const,
    title: "Confirmação de Pedido",
    description: "Enviado automaticamente quando um pedido é realizado.",
  },
  {
    key: "order_shipped" as const,
    title: "Pedido Enviado",
    description: "Enviado quando o pedido é despachado para entrega.",
  },
  {
    key: "welcome" as const,
    title: "Boas-vindas",
    description: "Enviado quando um novo cliente se cadastra na loja.",
  },
]

const ADMIN_TOKEN_KEY = "quadros_admin_token"

export default function EmailSettingsPage() {
  const [adminToken, setAdminToken] = useState<string | null>(null)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  const [settings, setSettings] = useState<EmailSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sendingTest, setSendingTest] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_TOKEN_KEY)
    if (stored) {
      setAdminToken(stored)
    }
  }, [])

  useEffect(() => {
    if (adminToken) {
      loadSettings()
    }
  }, [adminToken])

  async function loadSettings() {
    setLoading(true)
    try {
      const data = await getEmailSettings(adminToken!)
      setSettings(data.email_settings)
    } catch {
      toast.error("Falha ao carregar configurações. Token pode ter expirado.")
      localStorage.removeItem(ADMIN_TOKEN_KEY)
      setAdminToken(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginLoading(true)
    try {
      const data = await loginAdmin(loginEmail, loginPassword)
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token)
      setAdminToken(data.token)
      toast.success("Login admin realizado com sucesso!")
    } catch {
      toast.error("Credenciais inválidas. Use suas credenciais de admin do Medusa.")
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleSave() {
    if (!settings || !adminToken) return
    setSaving(true)
    try {
      await updateEmailSettings(adminToken, settings)
      toast.success("Configurações salvas!")
    } catch {
      toast.error("Falha ao salvar configurações.")
    } finally {
      setSaving(false)
    }
  }

  async function handleSendTest(emailType: string) {
    if (!adminToken) return
    setSendingTest(emailType)
    try {
      const data = await sendTestEmail(adminToken, emailType, loginEmail || "test@example.com")
      toast.success(data.message || "E-mail de teste enviado!")
    } catch {
      toast.error("Falha ao enviar e-mail de teste. Verifique a API key do Resend.")
    } finally {
      setSendingTest(null)
    }
  }

  function toggleEmailType(key: "order_placed" | "order_shipped" | "welcome") {
    if (!settings) return
    setSettings({
      ...settings,
      enabled: {
        ...settings.enabled,
        [key]: !settings.enabled[key],
      },
    })
  }

  // Admin login form
  if (!adminToken) {
    return (
      <div>
        <h2 className="font-serif text-2xl text-[#1a1a1a]">Configurações de E-mail</h2>
        <p className="mt-2 text-sm text-[#1a1a1a]/60">
          Faça login como administrador para gerenciar os e-mails transacionais.
        </p>

        <form onSubmit={handleLogin} className="mt-8 max-w-sm space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
              E-mail do Admin
            </label>
            <Input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="admin@quadros.com"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
              Senha
            </label>
            <Input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" disabled={loginLoading} className="w-full">
            {loginLoading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <LogIn className="mr-2 size-4" />
            )}
            Entrar como Admin
          </Button>
        </form>
      </div>
    )
  }

  // Loading state
  if (loading || !settings) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-[#1a1a1a]/60">
        <Loader2 className="size-4 animate-spin" />
        Carregando configurações...
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-[#1a1a1a]">Configurações de E-mail</h2>
          <p className="mt-1 text-sm text-[#1a1a1a]/60">
            Gerencie os e-mails transacionais da loja.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            localStorage.removeItem(ADMIN_TOKEN_KEY)
            setAdminToken(null)
            setSettings(null)
          }}
          className="text-xs text-[#1a1a1a]/40"
        >
          Sair do Admin
        </Button>
      </div>

      {/* Sender Settings */}
      <div className="mt-8 rounded-lg border border-[#e5e5e5] bg-white p-6">
        <h3 className="text-sm font-medium uppercase tracking-wider text-[#1a1a1a]/60">
          Remetente
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
              Nome
            </label>
            <Input
              value={settings.from_name}
              onChange={(e) =>
                setSettings({ ...settings, from_name: e.target.value })
              }
              placeholder="Quadros Store"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">
              E-mail do Remetente
            </label>
            <Input
              type="email"
              value={settings.from_email}
              onChange={(e) =>
                setSettings({ ...settings, from_email: e.target.value })
              }
              placeholder="loja@quadros.com"
            />
          </div>
        </div>
      </div>

      {/* Email Types */}
      <div className="mt-6 space-y-3">
        {EMAIL_TYPES.map((type) => (
          <div
            key={type.key}
            className="flex items-center justify-between rounded-lg border border-[#e5e5e5] bg-white p-5"
          >
            <div className="flex items-start gap-4">
              <div className="mt-0.5 rounded-md bg-[#1a1a1a]/5 p-2">
                <Mail className="size-4 text-[#1a1a1a]/60" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-[#1a1a1a]">
                  {type.title}
                </h4>
                <p className="mt-0.5 text-xs text-[#1a1a1a]/50">
                  {type.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSendTest(type.key)}
                disabled={sendingTest === type.key}
                className="text-xs"
              >
                {sendingTest === type.key ? (
                  <Loader2 className="mr-1.5 size-3 animate-spin" />
                ) : (
                  <Send className="mr-1.5 size-3" />
                )}
                Enviar Teste
              </Button>
              <Switch
                checked={settings.enabled[type.key]}
                onCheckedChange={() => toggleEmailType(type.key)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="mt-8">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  )
}
