"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, Plus, Pencil, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import {
  getCustomerAddresses,
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  type MedusaAddress,
} from "@/lib/medusa"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AddressForm {
  first_name: string
  last_name: string
  address_1: string
  address_2: string
  city: string
  province: string
  postal_code: string
  country_code: string
  phone: string
}

const emptyForm: AddressForm = {
  first_name: "",
  last_name: "",
  address_1: "",
  address_2: "",
  city: "",
  province: "",
  postal_code: "",
  country_code: "br",
  phone: "",
}

function getToken(): string | null {
  return localStorage.getItem("quadros_auth_token")
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<MedusaAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AddressForm>(emptyForm)

  const fetchAddresses = useCallback(async () => {
    const token = getToken()
    if (!token) return
    try {
      const data = await getCustomerAddresses(token)
      setAddresses(data.addresses || [])
    } catch {
      toast.error("Erro ao carregar enderecos.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAddresses()
  }, [fetchAddresses])

  function openNewForm() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
  }

  function openEditForm(address: MedusaAddress) {
    setForm({
      first_name: address.first_name || "",
      last_name: address.last_name || "",
      address_1: address.address_1 || "",
      address_2: address.address_2 || "",
      city: address.city || "",
      province: address.province || "",
      postal_code: address.postal_code || "",
      country_code: address.country_code || "br",
      phone: address.phone || "",
    })
    setEditingId(address.id)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSave() {
    const token = getToken()
    if (!token) return
    setSaving(true)

    try {
      if (editingId) {
        await updateCustomerAddress(token, editingId, form)
        toast.success("Endereco atualizado!")
      } else {
        await addCustomerAddress(token, form)
        toast.success("Endereco adicionado!")
      }
      closeForm()
      await fetchAddresses()
    } catch {
      toast.error("Erro ao salvar endereco.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const token = getToken()
    if (!token) return
    try {
      await deleteCustomerAddress(token, id)
      toast.success("Endereco removido!")
      await fetchAddresses()
    } catch {
      toast.error("Erro ao remover endereco.")
    }
  }

  function updateField(field: keyof AddressForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-[#1a1a1a]/40" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl text-[#1a1a1a]">Enderecos</h2>
        {!showForm && (
          <Button
            onClick={openNewForm}
            size="sm"
            className="bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90"
          >
            <Plus className="mr-1.5 size-4" />
            Adicionar
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="mt-6 rounded-lg border border-[#e5e5e5] bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-[#1a1a1a]">
              {editingId ? "Editar endereco" : "Novo endereco"}
            </h3>
            <button onClick={closeForm} className="text-[#1a1a1a]/40 hover:text-[#1a1a1a]">
              <X className="size-5" />
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">Nome</label>
              <Input
                value={form.first_name}
                onChange={(e) => updateField("first_name", e.target.value)}
                className="border-[#e5e5e5]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">Sobrenome</label>
              <Input
                value={form.last_name}
                onChange={(e) => updateField("last_name", e.target.value)}
                className="border-[#e5e5e5]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">Endereco</label>
              <Input
                value={form.address_1}
                onChange={(e) => updateField("address_1", e.target.value)}
                placeholder="Rua, numero"
                className="border-[#e5e5e5]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">Complemento</label>
              <Input
                value={form.address_2}
                onChange={(e) => updateField("address_2", e.target.value)}
                placeholder="Apto, Bloco..."
                className="border-[#e5e5e5]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">Cidade</label>
              <Input
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                className="border-[#e5e5e5]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">Estado</label>
              <Input
                value={form.province}
                onChange={(e) => updateField("province", e.target.value)}
                placeholder="UF"
                className="border-[#e5e5e5]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">CEP</label>
              <Input
                value={form.postal_code}
                onChange={(e) => updateField("postal_code", e.target.value)}
                placeholder="00000-000"
                className="border-[#e5e5e5]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[#1a1a1a]/70">Telefone</label>
              <Input
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="(11) 99999-9999"
                className="border-[#e5e5e5]"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
            <Button onClick={closeForm} variant="outline">
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Address list */}
      {addresses.length === 0 && !showForm ? (
        <p className="mt-8 text-sm text-[#1a1a1a]/50">
          Voce ainda nao tem enderecos salvos.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="rounded-lg border border-[#e5e5e5] bg-white p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-[#1a1a1a]">
                    {address.first_name} {address.last_name}
                  </p>
                  <p className="mt-1 text-sm text-[#1a1a1a]/60">
                    {address.address_1}
                    {address.address_2 && `, ${address.address_2}`}
                  </p>
                  <p className="text-sm text-[#1a1a1a]/60">
                    {address.city}
                    {address.province && ` - ${address.province}`}
                    {address.postal_code && `, ${address.postal_code}`}
                  </p>
                  {address.phone && (
                    <p className="text-sm text-[#1a1a1a]/60">{address.phone}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditForm(address)}
                    className="rounded p-1.5 text-[#1a1a1a]/40 hover:bg-[#1a1a1a]/5 hover:text-[#1a1a1a]"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="rounded p-1.5 text-[#1a1a1a]/40 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
