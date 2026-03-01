"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { User, Package, LogOut } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { useAuth } from "@/context/AuthContext"

const sidebarLinks = [
  { label: "Meus Dados", href: "/conta/dados", icon: User },
  { label: "Meus Pedidos", href: "/conta/pedidos", icon: Package },
]

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, customer } = useAuth()

  function handleLogout() {
    logout()
    router.push("/")
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl text-[#1a1a1a]">Minha Conta</h1>
        {customer && (
          <p className="mt-2 text-sm text-[#1a1a1a]/60">
            Ola, {customer.first_name || customer.email}!
          </p>
        )}

        <div className="mt-8 flex flex-col gap-8 lg:flex-row">
          {/* Sidebar */}
          <nav className="flex shrink-0 flex-row gap-1 lg:w-48 lg:flex-col">
            {sidebarLinks.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(link.href + "/")
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-[#1a1a1a]/5 text-[#1a1a1a] font-medium"
                      : "text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/5 hover:text-[#1a1a1a]"
                  }`}
                >
                  <Icon className="size-4" />
                  {link.label}
                </Link>
              )
            })}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[#1a1a1a]/60 transition-colors hover:bg-[#1a1a1a]/5 hover:text-[#1a1a1a]"
            >
              <LogOut className="size-4" />
              Sair
            </button>
          </nav>

          {/* Content */}
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
